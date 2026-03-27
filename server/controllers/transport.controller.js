const db = require('../config/db');
const { success, error } = require('../utils/responseHelper');

const generateCode = async () => {
  const [rows] = await db.query('SELECT transport_code FROM transport_companies ORDER BY id DESC LIMIT 1');
  if (rows.length === 0) return 'TRANS-001';
  const last = rows[0].transport_code;
  const parts = last.split('-');
  const num = parseInt(parts[parts.length - 1]) + 1;
  return `TRANS-${String(num).padStart(3, '0')}`;
};

exports.getAll = async (req, res) => {
  try {
    const { q, type, is_active } = req.query;
    let sql = 'SELECT * FROM transport_companies WHERE 1=1';
    const params = [];
    if (q) { sql += ' AND (company_name LIKE ? OR transport_code LIKE ?)'; params.push(`%${q}%`, `%${q}%`); }
    if (type) { sql += ' AND type = ?'; params.push(type); }
    if (is_active !== undefined) { sql += ' AND is_active = ?'; params.push(is_active === 'true' || is_active === '1' ? 1 : 0); }
    sql += ' ORDER BY company_name';
    const [rows] = await db.query(sql, params);
    return success(res, rows);
  } catch (err) {
    return error(res, err.message);
  }
};

exports.getById = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM transport_companies WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return error(res, 'Not found', 404);
    return success(res, rows[0]);
  } catch (err) {
    return error(res, err.message);
  }
};

exports.create = async (req, res) => {
  try {
    const { company_name, type = 'company', tax_id, address, phone, email, contact_person, is_active = true } = req.body;
    if (!company_name) return error(res, 'company_name is required', 400);
    const transport_code = await generateCode();
    const [result] = await db.query(
      'INSERT INTO transport_companies (transport_code, company_name, type, tax_id, address, phone, email, contact_person, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [transport_code, company_name, type, tax_id || null, address || null, phone || null, email || null, contact_person || null, is_active ? 1 : 0]
    );
    const [rows] = await db.query('SELECT * FROM transport_companies WHERE id = ?', [result.insertId]);
    return success(res, rows[0], 'Created successfully', 201);
  } catch (err) {
    return error(res, err.message);
  }
};

exports.update = async (req, res) => {
  try {
    const { company_name, type, tax_id, address, phone, email, contact_person, is_active } = req.body;
    const [existing] = await db.query('SELECT * FROM transport_companies WHERE id = ?', [req.params.id]);
    if (existing.length === 0) return error(res, 'Not found', 404);
    await db.query(
      'UPDATE transport_companies SET company_name=?, type=?, tax_id=?, address=?, phone=?, email=?, contact_person=?, is_active=? WHERE id=?',
      [company_name, type, tax_id || null, address || null, phone || null, email || null, contact_person || null, is_active ? 1 : 0, req.params.id]
    );
    const [rows] = await db.query('SELECT * FROM transport_companies WHERE id = ?', [req.params.id]);
    return success(res, rows[0], 'Updated successfully');
  } catch (err) {
    return error(res, err.message);
  }
};

exports.remove = async (req, res) => {
  try {
    const [result] = await db.query('UPDATE transport_companies SET is_active = 0 WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return error(res, 'Not found', 404);
    return success(res, null, 'Deleted successfully');
  } catch (err) {
    return error(res, err.message);
  }
};
