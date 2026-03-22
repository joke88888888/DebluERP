const db = require('../config/db');
const { success, error } = require('../utils/responseHelper');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const generateEmployeeCode = async () => {
  const [rows] = await db.query('SELECT employee_code FROM employees ORDER BY id DESC LIMIT 1');
  if (rows.length === 0) return 'EMP-0001';
  const last = rows[0].employee_code;
  const num = parseInt(last.split('-')[1]) + 1;
  return `EMP-${String(num).padStart(4, '0')}`;
};

exports.getPositions = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM positions ORDER BY id');
    return success(res, rows);
  } catch (err) {
    return error(res, err.message);
  }
};

exports.getEmploymentTypes = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM employment_types ORDER BY id');
    return success(res, rows);
  } catch (err) {
    return error(res, err.message);
  }
};

exports.getAll = async (req, res) => {
  try {
    const { q, position_id, employment_type_id, status, page = 1, limit = 25 } = req.query;
    let sql = `SELECT e.*, p.name as position_name, p.name_th as position_name_th,
               et.name as employment_type_name, et.name_th as employment_type_name_th
               FROM employees e
               LEFT JOIN positions p ON e.position_id = p.id
               LEFT JOIN employment_types et ON e.employment_type_id = et.id
               WHERE 1=1`;
    const params = [];
    if (q) {
      sql += ' AND (e.first_name LIKE ? OR e.last_name LIKE ? OR e.employee_code LIKE ?)';
      params.push(`%${q}%`, `%${q}%`, `%${q}%`);
    }
    if (position_id) { sql += ' AND e.position_id = ?'; params.push(position_id); }
    if (employment_type_id) { sql += ' AND e.employment_type_id = ?'; params.push(employment_type_id); }
    if (status) { sql += ' AND e.status = ?'; params.push(status); }

    const countSql = sql.replace(
      /SELECT e\.\*.*?FROM employees e/s,
      'SELECT COUNT(*) as total FROM employees e'
    );
    const [countResult] = await db.query(countSql, params);
    const total = countResult[0].total;

    sql += ' ORDER BY e.employee_code';
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
      `SELECT e.*, p.name as position_name, p.name_th as position_name_th,
       et.name as employment_type_name, et.name_th as employment_type_name_th
       FROM employees e
       LEFT JOIN positions p ON e.position_id = p.id
       LEFT JOIN employment_types et ON e.employment_type_id = et.id
       WHERE e.id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) return error(res, 'Not found', 404);
    const [docs] = await db.query('SELECT * FROM employee_documents WHERE employee_id = ?', [req.params.id]);
    return success(res, { ...rows[0], documents: docs });
  } catch (err) {
    return error(res, err.message);
  }
};

exports.create = async (req, res) => {
  try {
    const {
      prefix, first_name, last_name, id_card_number, phone, email, address,
      position_id, employment_type_id, base_salary = 0, has_ot = false,
      ot_rate_multiplier = 1.5, hire_date, status = 'active',
      create_user, username, password, user_role = 'user'
    } = req.body;
    if (!first_name || !last_name) return error(res, 'first_name, last_name are required', 400);

    if (create_user === 'true' || create_user === true) {
      if (!username || !password) return error(res, 'username and password are required for user account', 400);
      const [existing] = await db.query('SELECT id FROM users WHERE username = ?', [username]);
      if (existing.length > 0) return error(res, 'Username นี้ถูกใช้งานแล้ว', 409);
    }

    const employee_code = await generateEmployeeCode();
    const profile_image = req.file ? `employees/profiles/${req.file.filename}` : null;

    const [result] = await db.query(
      `INSERT INTO employees (employee_code, prefix, first_name, last_name, id_card_number, phone, email,
       address, position_id, employment_type_id, base_salary, has_ot, ot_rate_multiplier, hire_date, status, profile_image)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [employee_code, prefix || null, first_name, last_name, id_card_number || null, phone || null,
       email || null, address || null, position_id || null, employment_type_id || null,
       base_salary, has_ot, ot_rate_multiplier, hire_date || null, status, profile_image]
    );

    const employeeId = result.insertId;

    if (create_user === 'true' || create_user === true) {
      const password_hash = await bcrypt.hash(password, 10);
      await db.query(
        'INSERT INTO users (username, password_hash, employee_id, role) VALUES (?, ?, ?, ?)',
        [username, password_hash, employeeId, user_role]
      );
    }

    const [rows] = await db.query('SELECT * FROM employees WHERE id = ?', [employeeId]);
    return success(res, rows[0], 'Created successfully', 201);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return error(res, 'ID card number already exists', 409);
    return error(res, err.message);
  }
};

exports.update = async (req, res) => {
  try {
    const {
      prefix, first_name, last_name, id_card_number, phone, email, address,
      position_id, employment_type_id, base_salary, has_ot, ot_rate_multiplier, hire_date, status
    } = req.body;
    const [existing] = await db.query('SELECT * FROM employees WHERE id = ?', [req.params.id]);
    if (existing.length === 0) return error(res, 'Not found', 404);

    let profile_image = existing[0].profile_image;
    if (req.file) {
      if (profile_image) {
        const oldPath = path.join(__dirname, '..', 'uploads', profile_image);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      profile_image = `employees/profiles/${req.file.filename}`;
    }

    await db.query(
      `UPDATE employees SET prefix=?, first_name=?, last_name=?, id_card_number=?, phone=?, email=?,
       address=?, position_id=?, employment_type_id=?, base_salary=?, has_ot=?, ot_rate_multiplier=?,
       hire_date=?, status=?, profile_image=? WHERE id=?`,
      [prefix || null, first_name, last_name, id_card_number || null, phone || null, email || null,
       address || null, position_id || null, employment_type_id || null, base_salary, has_ot,
       ot_rate_multiplier, hire_date || null, status, profile_image, req.params.id]
    );
    const [rows] = await db.query('SELECT * FROM employees WHERE id = ?', [req.params.id]);
    return success(res, rows[0], 'Updated successfully');
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return error(res, 'ID card number already exists', 409);
    return error(res, err.message);
  }
};

exports.remove = async (req, res) => {
  try {
    const [result] = await db.query("UPDATE employees SET status = 'resigned' WHERE id = ?", [req.params.id]);
    if (result.affectedRows === 0) return error(res, 'Not found', 404);
    return success(res, null, 'Deleted successfully');
  } catch (err) {
    return error(res, err.message);
  }
};

exports.uploadDocument = async (req, res) => {
  try {
    if (!req.file) return error(res, 'File required', 400);
    const { document_type, document_name } = req.body;
    if (!document_type || !document_name) return error(res, 'document_type, document_name required', 400);
    const file_path = `employees/documents/${req.file.filename}`;
    const [result] = await db.query(
      'INSERT INTO employee_documents (employee_id, document_type, document_name, file_path) VALUES (?, ?, ?, ?)',
      [req.params.id, document_type, document_name, file_path]
    );
    const [rows] = await db.query('SELECT * FROM employee_documents WHERE id = ?', [result.insertId]);
    return success(res, rows[0], 'Document uploaded', 201);
  } catch (err) {
    return error(res, err.message);
  }
};

exports.deleteDocument = async (req, res) => {
  try {
    const [docs] = await db.query('SELECT * FROM employee_documents WHERE id = ? AND employee_id = ?', [req.params.docId, req.params.id]);
    if (docs.length === 0) return error(res, 'Not found', 404);
    const filePath = path.join(__dirname, '..', 'uploads', docs[0].file_path);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    await db.query('DELETE FROM employee_documents WHERE id = ?', [req.params.docId]);
    return success(res, null, 'Document deleted');
  } catch (err) {
    return error(res, err.message);
  }
};

exports.uploadProfileImage = async (req, res) => {
  try {
    if (!req.file) return error(res, 'File required', 400);
    const [existing] = await db.query('SELECT profile_image FROM employees WHERE id = ?', [req.params.id]);
    if (existing.length === 0) return error(res, 'Employee not found', 404);
    if (existing[0].profile_image) {
      const oldPath = path.join(__dirname, '..', 'uploads', existing[0].profile_image);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }
    const profile_image = `employees/profiles/${req.file.filename}`;
    await db.query('UPDATE employees SET profile_image = ? WHERE id = ?', [profile_image, req.params.id]);
    return success(res, { profile_image }, 'Profile image updated');
  } catch (err) {
    return error(res, err.message);
  }
};
