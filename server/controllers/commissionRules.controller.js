const db = require('../config/db');
const { success, error } = require('../utils/responseHelper');

exports.getAll = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM commission_rules ORDER BY condition_type, commission_percent DESC');
    return success(res, rows);
  } catch (err) {
    return error(res, err.message);
  }
};

exports.getById = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM commission_rules WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return error(res, 'Not found', 404);
    return success(res, rows[0]);
  } catch (err) {
    return error(res, err.message);
  }
};

exports.create = async (req, res) => {
  try {
    const { name, condition_type, days_after_credit, commission_percent, description, is_active = true } = req.body;
    if (!name || !condition_type || commission_percent === undefined) {
      return error(res, 'name, condition_type, commission_percent are required', 400);
    }
    const [result] = await db.query(
      'INSERT INTO commission_rules (name, condition_type, days_after_credit, commission_percent, description, is_active) VALUES (?, ?, ?, ?, ?, ?)',
      [name, condition_type, days_after_credit || null, commission_percent, description || null, is_active]
    );
    const [rows] = await db.query('SELECT * FROM commission_rules WHERE id = ?', [result.insertId]);
    return success(res, rows[0], 'Created successfully', 201);
  } catch (err) {
    return error(res, err.message);
  }
};

exports.update = async (req, res) => {
  try {
    const { name, condition_type, days_after_credit, commission_percent, description, is_active } = req.body;
    const [existing] = await db.query('SELECT * FROM commission_rules WHERE id = ?', [req.params.id]);
    if (existing.length === 0) return error(res, 'Not found', 404);
    await db.query(
      'UPDATE commission_rules SET name=?, condition_type=?, days_after_credit=?, commission_percent=?, description=?, is_active=? WHERE id=?',
      [name, condition_type, days_after_credit || null, commission_percent, description || null, is_active, req.params.id]
    );
    const [rows] = await db.query('SELECT * FROM commission_rules WHERE id = ?', [req.params.id]);
    return success(res, rows[0], 'Updated successfully');
  } catch (err) {
    return error(res, err.message);
  }
};

exports.remove = async (req, res) => {
  try {
    const [result] = await db.query('UPDATE commission_rules SET is_active = 0 WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return error(res, 'Not found', 404);
    return success(res, null, 'Deleted successfully');
  } catch (err) {
    return error(res, err.message);
  }
};
