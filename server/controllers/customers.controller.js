const db = require('../config/db');
const { success, error } = require('../utils/responseHelper');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const generateCustomerCode = async () => {
  const [rows] = await db.query('SELECT customer_code FROM customers ORDER BY id DESC LIMIT 1');
  if (rows.length === 0) return 'CUST-0001';
  const last = rows[0].customer_code;
  const num = parseInt(last.split('-')[1]) + 1;
  return `CUST-${String(num).padStart(4, '0')}`;
};

exports.getAll = async (req, res) => {
  try {
    const { q, region_id, status, page = 1, limit = 25 } = req.query;
    let sql = `SELECT c.*, p.name_th as province_name, r.name_th as region_name,
               tc.company_name as transport_name,
               e.first_name as sales_first_name, e.last_name as sales_last_name,
               COALESCE((SELECT SUM(cc.credit_limit) FROM customer_credits cc WHERE cc.customer_id = c.id), 0) as total_credit_limit
               FROM customers c
               LEFT JOIN provinces p ON c.province_id = p.id
               LEFT JOIN regions r ON c.region_id = r.id
               LEFT JOIN transport_companies tc ON c.transport_company_id = tc.id
               LEFT JOIN employees e ON c.sales_person_id = e.id
               WHERE 1=1`;
    const params = [];
    if (q) {
      sql += ' AND (c.company_name LIKE ? OR c.customer_code LIKE ?)';
      params.push(`%${q}%`, `%${q}%`);
    }
    if (region_id) { sql += ' AND c.region_id = ?'; params.push(region_id); }
    if (status) { sql += ' AND c.status = ?'; params.push(status); }

    const countSql = 'SELECT COUNT(*) as total FROM customers c WHERE 1=1' +
      (q ? ' AND (c.company_name LIKE ? OR c.customer_code LIKE ?)' : '') +
      (region_id ? ' AND c.region_id = ?' : '') +
      (status ? ' AND c.status = ?' : '');
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
      `SELECT c.*, p.name_th as province_name, r.name_th as region_name,
       tc.company_name as transport_name,
       e.first_name as sales_first_name, e.last_name as sales_last_name
       FROM customers c
       LEFT JOIN provinces p ON c.province_id = p.id
       LEFT JOIN regions r ON c.region_id = r.id
       LEFT JOIN transport_companies tc ON c.transport_company_id = tc.id
       LEFT JOIN employees e ON c.sales_person_id = e.id
       WHERE c.id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) return error(res, 'Not found', 404);
    const [contacts] = await db.query('SELECT * FROM customer_contacts WHERE customer_id = ? ORDER BY sort_order', [req.params.id]);
    const [credits] = await db.query(
      `SELECT cc.*, b.name as brand_name FROM customer_credits cc
       LEFT JOIN brands b ON cc.brand_id = b.id WHERE cc.customer_id = ?`, [req.params.id]
    );
    const [bankAccounts] = await db.query('SELECT * FROM customer_bank_accounts WHERE customer_id = ? ORDER BY sort_order', [req.params.id]);
    const [documents] = await db.query('SELECT * FROM customer_documents WHERE customer_id = ? ORDER BY uploaded_at DESC', [req.params.id]);
    const [subCustomers] = await db.query(
      `SELECT sc.*, p.name_th as province_name FROM sub_customers sc
       LEFT JOIN provinces p ON sc.province_id = p.id
       WHERE sc.parent_customer_id = ? ORDER BY sc.sub_customer_code`, [req.params.id]
    );
    return success(res, { ...rows[0], contacts, credits, bankAccounts, documents, subCustomers });
  } catch (err) {
    return error(res, err.message);
  }
};

exports.create = async (req, res) => {
  try {
    const {
      company_name, id_card_number, is_vat = 0, tax_id,
      house_number, moo, soi, road, province_id, amphoe, tambon, zipcode, region_id,
      username, password, role = 'customer', status = 'active',
      transport_company_id, boxes_per_shipment = 6,
      sales_person_id, sales_zone, customer_since,
      contacts = [], credits = [], bankAccounts = []
    } = req.body;
    if (!company_name) return error(res, 'company_name is required', 400);

    if (username) {
      const [existing] = await db.query('SELECT id FROM customers WHERE username = ?', [username]);
      if (existing.length > 0) return error(res, 'Username นี้ถูกใช้งานแล้ว', 409);
    }

    const customer_code = await generateCustomerCode();
    const password_hash = password ? await bcrypt.hash(password, 10) : null;
    const isVatInt = is_vat === true || is_vat === 'true' || is_vat === 1 || is_vat === '1' ? 1 : 0;

    const [result] = await db.query(
      `INSERT INTO customers (customer_code, company_name, id_card_number, is_vat, tax_id,
       house_number, moo, soi, road, province_id, amphoe, tambon, zipcode, region_id,
       username, password_hash, role, status, transport_company_id, boxes_per_shipment,
       sales_person_id, sales_zone, customer_since)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [customer_code, company_name, id_card_number || null, isVatInt, tax_id || null,
       house_number || null, moo || null, soi || null, road || null, province_id || null,
       amphoe || null, tambon || null, zipcode || null, region_id || null,
       username || null, password_hash, role, status,
       transport_company_id || null, boxes_per_shipment,
       sales_person_id || null, sales_zone || null, customer_since || null]
    );
    const customerId = result.insertId;

    const contactsArr = typeof contacts === 'string' ? JSON.parse(contacts) : contacts;
    for (let i = 0; i < contactsArr.length; i++) {
      const ct = contactsArr[i];
      await db.query(
        'INSERT INTO customer_contacts (customer_id, phone, phone_backup, email, line_id, facebook, contact_name, contact_position, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [customerId, ct.phone || null, ct.phone_backup || null, ct.email || null, ct.line_id || null, ct.facebook || null, ct.contact_name || null, ct.contact_position || null, i]
      );
    }

    const creditsArr = typeof credits === 'string' ? JSON.parse(credits) : credits;
    for (const cr of creditsArr) {
      if (cr.brand_id) {
        await db.query(
          'INSERT INTO customer_credits (customer_id, brand_id, credit_limit, credit_days) VALUES (?, ?, ?, ?)',
          [customerId, cr.brand_id, cr.credit_limit || 0, cr.credit_days || 0]
        );
      }
    }

    const bankArr = typeof bankAccounts === 'string' ? JSON.parse(bankAccounts) : bankAccounts;
    for (let i = 0; i < bankArr.length; i++) {
      const ba = bankArr[i];
      await db.query(
        'INSERT INTO customer_bank_accounts (customer_id, bank_name, account_number, account_name, is_primary, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
        [customerId, ba.bank_name || null, ba.account_number || null, ba.account_name || null, i === 0 ? 1 : 0, i]
      );
    }

    const [rows] = await db.query('SELECT * FROM customers WHERE id = ?', [customerId]);
    return success(res, rows[0], 'Created successfully', 201);
  } catch (err) {
    return error(res, err.message);
  }
};

exports.update = async (req, res) => {
  try {
    const {
      company_name, id_card_number, is_vat, tax_id,
      house_number, moo, soi, road, province_id, amphoe, tambon, zipcode, region_id,
      username, password, role, status,
      transport_company_id, boxes_per_shipment,
      sales_person_id, sales_zone, customer_since,
      contacts, credits, bankAccounts
    } = req.body;
    const [existing] = await db.query('SELECT * FROM customers WHERE id = ?', [req.params.id]);
    if (existing.length === 0) return error(res, 'Not found', 404);

    const isVatInt = is_vat === true || is_vat === 'true' || is_vat === 1 || is_vat === '1' ? 1 : 0;
    let password_hash = existing[0].password_hash;
    if (password) password_hash = await bcrypt.hash(password, 10);

    await db.query(
      `UPDATE customers SET company_name=?, id_card_number=?, is_vat=?, tax_id=?,
       house_number=?, moo=?, soi=?, road=?, province_id=?, amphoe=?, tambon=?, zipcode=?, region_id=?,
       username=?, password_hash=?, role=?, status=?, transport_company_id=?, boxes_per_shipment=?,
       sales_person_id=?, sales_zone=?, customer_since=? WHERE id=?`,
      [company_name, id_card_number || null, isVatInt, tax_id || null,
       house_number || null, moo || null, soi || null, road || null, province_id || null,
       amphoe || null, tambon || null, zipcode || null, region_id || null,
       username || null, password_hash, role || 'customer', status || 'active',
       transport_company_id || null, boxes_per_shipment || 6,
       sales_person_id || null, sales_zone || null, customer_since || null,
       req.params.id]
    );

    if (contacts !== undefined) {
      await db.query('DELETE FROM customer_contacts WHERE customer_id = ?', [req.params.id]);
      const contactsArr = typeof contacts === 'string' ? JSON.parse(contacts) : contacts;
      for (let i = 0; i < contactsArr.length; i++) {
        const ct = contactsArr[i];
        await db.query(
          'INSERT INTO customer_contacts (customer_id, phone, phone_backup, email, line_id, facebook, contact_name, contact_position, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [req.params.id, ct.phone || null, ct.phone_backup || null, ct.email || null, ct.line_id || null, ct.facebook || null, ct.contact_name || null, ct.contact_position || null, i]
        );
      }
    }

    if (credits !== undefined) {
      await db.query('DELETE FROM customer_credits WHERE customer_id = ?', [req.params.id]);
      const creditsArr = typeof credits === 'string' ? JSON.parse(credits) : credits;
      for (const cr of creditsArr) {
        if (cr.brand_id) {
          await db.query(
            'INSERT INTO customer_credits (customer_id, brand_id, credit_limit, credit_days) VALUES (?, ?, ?, ?)',
            [req.params.id, cr.brand_id, cr.credit_limit || 0, cr.credit_days || 0]
          );
        }
      }
    }

    if (bankAccounts !== undefined) {
      await db.query('DELETE FROM customer_bank_accounts WHERE customer_id = ?', [req.params.id]);
      const bankArr = typeof bankAccounts === 'string' ? JSON.parse(bankAccounts) : bankAccounts;
      for (let i = 0; i < bankArr.length; i++) {
        const ba = bankArr[i];
        await db.query(
          'INSERT INTO customer_bank_accounts (customer_id, bank_name, account_number, account_name, is_primary, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
          [req.params.id, ba.bank_name || null, ba.account_number || null, ba.account_name || null, i === 0 ? 1 : 0, i]
        );
      }
    }

    const [rows] = await db.query('SELECT * FROM customers WHERE id = ?', [req.params.id]);
    return success(res, rows[0], 'Updated successfully');
  } catch (err) {
    return error(res, err.message);
  }
};

exports.remove = async (req, res) => {
  try {
    const [result] = await db.query("UPDATE customers SET status = 'inactive' WHERE id = ?", [req.params.id]);
    if (result.affectedRows === 0) return error(res, 'Not found', 404);
    return success(res, null, 'Deleted successfully');
  } catch (err) {
    return error(res, err.message);
  }
};

exports.uploadDocument = async (req, res) => {
  try {
    if (!req.file) return error(res, 'File required', 400);
    const { document_type = 'other', document_name } = req.body;
    const [existing] = await db.query('SELECT id FROM customers WHERE id = ?', [req.params.id]);
    if (existing.length === 0) return error(res, 'Customer not found', 404);
    const file_path = `customers/documents/${req.file.filename}`;
    const [result] = await db.query(
      'INSERT INTO customer_documents (customer_id, document_type, document_name, file_path) VALUES (?, ?, ?, ?)',
      [req.params.id, document_type, document_name || req.file.originalname, file_path]
    );
    const [rows] = await db.query('SELECT * FROM customer_documents WHERE id = ?', [result.insertId]);
    return success(res, rows[0], 'Document uploaded', 201);
  } catch (err) {
    return error(res, err.message);
  }
};

exports.deleteDocument = async (req, res) => {
  try {
    const [docs] = await db.query('SELECT * FROM customer_documents WHERE id = ? AND customer_id = ?', [req.params.docId, req.params.id]);
    if (docs.length === 0) return error(res, 'Not found', 404);
    const filePath = path.join(__dirname, '..', 'uploads', docs[0].file_path);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    await db.query('DELETE FROM customer_documents WHERE id = ?', [req.params.docId]);
    return success(res, null, 'Document deleted');
  } catch (err) {
    return error(res, err.message);
  }
};
