const db = require('../config/db');
const { success, error } = require('../utils/responseHelper');

const generateSubCode = async () => {
  const [rows] = await db.query('SELECT sub_customer_code FROM sub_customers ORDER BY id DESC LIMIT 1');
  if (rows.length === 0) return 'SUB-0001';
  const last = rows[0].sub_customer_code;
  const num = parseInt(last.split('-')[1]) + 1;
  return `SUB-${String(num).padStart(4, '0')}`;
};

exports.getAll = async (req, res) => {
  try {
    const { q, parent_customer_id, status, page = 1, limit = 25 } = req.query;
    let sql = `SELECT sc.*, p.name_th as province_name,
               c.company_name as parent_company_name, c.customer_code as parent_customer_code,
               sc2.company_name as shared_credit_company_name
               FROM sub_customers sc
               LEFT JOIN provinces p ON sc.province_id = p.id
               LEFT JOIN customers c ON sc.parent_customer_id = c.id
               LEFT JOIN customers sc2 ON sc.shared_credit_customer_id = sc2.id
               WHERE 1=1`;
    const params = [];
    if (q) { sql += ' AND (sc.company_name LIKE ? OR sc.sub_customer_code LIKE ?)'; params.push(`%${q}%`, `%${q}%`); }
    if (parent_customer_id) { sql += ' AND sc.parent_customer_id = ?'; params.push(parent_customer_id); }
    if (status) { sql += ' AND sc.status = ?'; params.push(status); }

    const countSql = 'SELECT COUNT(*) as total FROM sub_customers sc WHERE 1=1' +
      (q ? ' AND (sc.company_name LIKE ? OR sc.sub_customer_code LIKE ?)' : '') +
      (parent_customer_id ? ' AND sc.parent_customer_id = ?' : '') +
      (status ? ' AND sc.status = ?' : '');
    const [countResult] = await db.query(countSql, params);
    const total = countResult[0].total;

    sql += ' ORDER BY sc.sub_customer_code';
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
      `SELECT sc.*, p.name_th as province_name,
       c.company_name as parent_company_name, c.customer_code as parent_customer_code
       FROM sub_customers sc
       LEFT JOIN provinces p ON sc.province_id = p.id
       LEFT JOIN customers c ON sc.parent_customer_id = c.id
       WHERE sc.id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) return error(res, 'Not found', 404);
    const [contacts] = await db.query('SELECT * FROM sub_customer_contacts WHERE sub_customer_id = ? ORDER BY sort_order', [req.params.id]);
    return success(res, { ...rows[0], contacts });
  } catch (err) {
    return error(res, err.message);
  }
};

exports.create = async (req, res) => {
  try {
    const {
      parent_customer_id, company_name, id_card_number, is_vat = 0, tax_id,
      house_number, moo, soi, road, province_id, amphoe, tambon, zipcode,
      status = 'active', boxes_per_shipment = 6,
      sales_person_id, sales_zone, customer_since,
      shared_credit_customer_id, contacts = []
    } = req.body;
    if (!parent_customer_id || !company_name) return error(res, 'parent_customer_id and company_name are required', 400);
    const isVatInt = is_vat === true || is_vat === 'true' || is_vat === 1 || is_vat === '1' ? 1 : 0;
    const sub_customer_code = await generateSubCode();

    const [result] = await db.query(
      `INSERT INTO sub_customers (sub_customer_code, parent_customer_id, company_name, id_card_number, is_vat, tax_id,
       house_number, moo, soi, road, province_id, amphoe, tambon, zipcode,
       status, boxes_per_shipment, sales_person_id, sales_zone, customer_since, shared_credit_customer_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [sub_customer_code, parent_customer_id, company_name, id_card_number || null, isVatInt, tax_id || null,
       house_number || null, moo || null, soi || null, road || null, province_id || null,
       amphoe || null, tambon || null, zipcode || null,
       status, boxes_per_shipment, sales_person_id || null, sales_zone || null,
       customer_since || null, shared_credit_customer_id || null]
    );
    const subId = result.insertId;

    const contactsArr = typeof contacts === 'string' ? JSON.parse(contacts) : contacts;
    for (let i = 0; i < contactsArr.length; i++) {
      const ct = contactsArr[i];
      await db.query(
        'INSERT INTO sub_customer_contacts (sub_customer_id, phone, phone_backup, email, line_id, facebook, contact_name, contact_position, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [subId, ct.phone || null, ct.phone_backup || null, ct.email || null, ct.line_id || null, ct.facebook || null, ct.contact_name || null, ct.contact_position || null, i]
      );
    }

    const [rows] = await db.query('SELECT * FROM sub_customers WHERE id = ?', [subId]);
    return success(res, rows[0], 'Created successfully', 201);
  } catch (err) {
    return error(res, err.message);
  }
};

exports.update = async (req, res) => {
  try {
    const {
      parent_customer_id, company_name, id_card_number, is_vat, tax_id,
      house_number, moo, soi, road, province_id, amphoe, tambon, zipcode,
      status, boxes_per_shipment, sales_person_id, sales_zone, customer_since,
      shared_credit_customer_id, contacts
    } = req.body;
    const [existing] = await db.query('SELECT * FROM sub_customers WHERE id = ?', [req.params.id]);
    if (existing.length === 0) return error(res, 'Not found', 404);
    const isVatInt = is_vat === true || is_vat === 'true' || is_vat === 1 || is_vat === '1' ? 1 : 0;

    await db.query(
      `UPDATE sub_customers SET parent_customer_id=?, company_name=?, id_card_number=?, is_vat=?, tax_id=?,
       house_number=?, moo=?, soi=?, road=?, province_id=?, amphoe=?, tambon=?, zipcode=?,
       status=?, boxes_per_shipment=?, sales_person_id=?, sales_zone=?, customer_since=?, shared_credit_customer_id=?
       WHERE id=?`,
      [parent_customer_id, company_name, id_card_number || null, isVatInt, tax_id || null,
       house_number || null, moo || null, soi || null, road || null, province_id || null,
       amphoe || null, tambon || null, zipcode || null,
       status || 'active', boxes_per_shipment || 6, sales_person_id || null,
       sales_zone || null, customer_since || null, shared_credit_customer_id || null,
       req.params.id]
    );

    if (contacts !== undefined) {
      await db.query('DELETE FROM sub_customer_contacts WHERE sub_customer_id = ?', [req.params.id]);
      const contactsArr = typeof contacts === 'string' ? JSON.parse(contacts) : contacts;
      for (let i = 0; i < contactsArr.length; i++) {
        const ct = contactsArr[i];
        await db.query(
          'INSERT INTO sub_customer_contacts (sub_customer_id, phone, phone_backup, email, line_id, facebook, contact_name, contact_position, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [req.params.id, ct.phone || null, ct.phone_backup || null, ct.email || null, ct.line_id || null, ct.facebook || null, ct.contact_name || null, ct.contact_position || null, i]
        );
      }
    }

    const [rows] = await db.query('SELECT * FROM sub_customers WHERE id = ?', [req.params.id]);
    return success(res, rows[0], 'Updated successfully');
  } catch (err) {
    return error(res, err.message);
  }
};

exports.remove = async (req, res) => {
  try {
    const [result] = await db.query("UPDATE sub_customers SET status = 'inactive' WHERE id = ?", [req.params.id]);
    if (result.affectedRows === 0) return error(res, 'Not found', 404);
    return success(res, null, 'Deleted successfully');
  } catch (err) {
    return error(res, err.message);
  }
};
