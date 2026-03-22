const db = require('../config/db');
const { success, error } = require('../utils/responseHelper');

exports.getAll = async (req, res) => {
  try {
    const { is_active } = req.query;
    let sql = 'SELECT * FROM sizes';
    const params = [];
    if (is_active !== undefined) {
      sql += ' WHERE is_active = ?';
      params.push(is_active === 'true' || is_active === '1' ? 1 : 0);
    }
    sql += ' ORDER BY code';
    const [rows] = await db.query(sql, params);
    return success(res, rows);
  } catch (err) {
    return error(res, err.message);
  }
};

exports.getById = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM sizes WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return error(res, 'Not found', 404);
    return success(res, rows[0]);
  } catch (err) {
    return error(res, err.message);
  }
};

exports.create = async (req, res) => {
  try {
    const { code, size_value, size_system = 'EU', is_active = true } = req.body;
    if (!code || !size_value) return error(res, 'code, size_value are required', 400);
    const [result] = await db.query(
      'INSERT INTO sizes (code, size_value, size_system, is_active) VALUES (?, ?, ?, ?)',
      [code, size_value, size_system, is_active]
    );
    const [rows] = await db.query('SELECT * FROM sizes WHERE id = ?', [result.insertId]);
    return success(res, rows[0], 'Created successfully', 201);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return error(res, 'Code already exists', 409);
    return error(res, err.message);
  }
};

exports.update = async (req, res) => {
  try {
    const { code, size_value, size_system, is_active } = req.body;
    const [result] = await db.query(
      'UPDATE sizes SET code=?, size_value=?, size_system=?, is_active=? WHERE id=?',
      [code, size_value, size_system, is_active, req.params.id]
    );
    if (result.affectedRows === 0) return error(res, 'Not found', 404);
    const [rows] = await db.query('SELECT * FROM sizes WHERE id = ?', [req.params.id]);
    return success(res, rows[0], 'Updated successfully');
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return error(res, 'Code already exists', 409);
    return error(res, err.message);
  }
};

exports.remove = async (req, res) => {
  try {
    const [result] = await db.query('UPDATE sizes SET is_active = 0 WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return error(res, 'Not found', 404);
    return success(res, null, 'Deleted successfully');
  } catch (err) {
    return error(res, err.message);
  }
};
