const db = require('../config/db');
const { success, error } = require('../utils/responseHelper');

const generateCustomerCode = async () => {
  const [rows] = await db.query('SELECT customer_code FROM customers ORDER BY id DESC LIMIT 1');
  if (rows.length === 0) return 'CUST-0001';
  const last = rows[0].customer_code;
  const num = parseInt(last.split('-')[1]) + 1;
  return `CUST-${String(num).padStart(4, '0')}`;
};

exports.getAll = async (req, res) => {
  try {
    const { q, region_id, is_active, page = 1, limit = 25 } = req.query;
    let sql = `SELECT c.*, p.name_th as province_name, r.name_th as region_name
               FROM customers c
               LEFT JOIN provinces p ON c.province_id = p.id
               LEFT JOIN regions r ON c.region_id = r.id
               WHERE 1=1`;
    const params = [];
    if (q) {
      sql += ' AND (c.company_name LIKE ? OR c.customer_code LIKE ? OR c.contact_name LIKE ?)';
      params.push(`%${q}%`, `%${q}%`, `%${q}%`);
    }
    if (region_id) { sql += ' AND c.region_id = ?'; params.push(region_id); }
    if (is_active !== undefined) { sql += ' AND c.is_active = ?'; params.push(is_active === 'true' || is_active === '1' ? 1 : 0); }

    const countSql = sql.replace(
      /SELECT c\.\*.*?FROM customers c/s,
      'SELECT COUNT(*) as total FROM customers c'
    );
    const [countResult] = await db.query(countSql, params);
    const total = countResult[0].total;

    sql += ' ORDER BY c.customer_code';
    const offset = (parseInt(page) - 1) * parseInt(limit);
    sql += ` LIMIT ${parseInt(limit)} OFFSET ${offset}`;
    const [rows] = await db.query(sql, params);
    return res.json({ success: true, data: rows, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    return error(res, err.message);
  }
};

exports.getById = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT c.*, p.name_th as province_name, r.name_th as region_name
       FROM customers c
       LEFT JOIN provinces p ON c.province_id = p.id
       LEFT JOIN regions r ON c.region_id = r.id
       WHERE c.id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) return error(res, 'Not found', 404);
    return success(res, rows[0]);
  } catch (err) {
    return error(res, err.message);
  }
};

exports.create = async (req, res) => {
  try {
    const {
      company_name, contact_name, phone, email, address,
      province_id, region_id, credit_terms = 0, discount_percent = 0, credit_limit = 0, is_active = true
    } = req.body;
    if (!company_name) return error(res, 'company_name is required', 400);
    const customer_code = await generateCustomerCode();
    const [result] = await db.query(
      `INSERT INTO customers (customer_code, company_name, contact_name, phone, email, address,
       province_id, region_id, credit_terms, discount_percent, credit_limit, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [customer_code, company_name, contact_name || null, phone || null, email || null, address || null,
       province_id || null, region_id || null, credit_terms, discount_percent, credit_limit, is_active]
    );
    const [rows] = await db.query('SELECT * FROM customers WHERE id = ?', [result.insertId]);
    return success(res, rows[0], 'Created successfully', 201);
  } catch (err) {
    return error(res, err.message);
  }
};

exports.update = async (req, res) => {
  try {
    const {
      company_name, contact_name, phone, email, address,
      province_id, region_id, credit_terms, discount_percent, credit_limit, is_active
    } = req.body;
    const [existing] = await db.query('SELECT * FROM customers WHERE id = ?', [req.params.id]);
    if (existing.length === 0) return error(res, 'Not found', 404);
    await db.query(
      `UPDATE customers SET company_name=?, contact_name=?, phone=?, email=?, address=?,
       province_id=?, region_id=?, credit_terms=?, discount_percent=?, credit_limit=?, is_active=? WHERE id=?`,
      [company_name, contact_name || null, phone || null, email || null, address || null,
       province_id || null, region_id || null, credit_terms, discount_percent, credit_limit, is_active, req.params.id]
    );
    const [rows] = await db.query('SELECT * FROM customers WHERE id = ?', [req.params.id]);
    return success(res, rows[0], 'Updated successfully');
  } catch (err) {
    return error(res, err.message);
  }
};

exports.remove = async (req, res) => {
  try {
    const [result] = await db.query('UPDATE customers SET is_active = 0 WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return error(res, 'Not found', 404);
    return success(res, null, 'Deleted successfully');
  } catch (err) {
    return error(res, err.message);
  }
};
