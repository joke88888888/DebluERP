const db = require('../config/db');
const { success, error } = require('../utils/responseHelper');

exports.getAll = async (req, res) => {
  try {
    const { brand_id, is_active, q, page = 1, limit = 50 } = req.query;
    let sql = `SELECT m.*, b.name as brand_name, b.code as brand_code,
               f.name as floor_mold_name FROM models m
               LEFT JOIN brands b ON m.brand_id = b.id
               LEFT JOIN floor_molds f ON m.floor_mold_id = f.id
               WHERE 1=1`;
    const params = [];
    if (brand_id) { sql += ' AND m.brand_id = ?'; params.push(brand_id); }
    if (q) { sql += ' AND m.name LIKE ?'; params.push(`%${q}%`); }
    if (is_active !== undefined) { sql += ' AND m.is_active = ?'; params.push(is_active === 'true' || is_active === '1' ? 1 : 0); }
    sql += ' ORDER BY b.name, m.name';
    const offset = (parseInt(page) - 1) * parseInt(limit);
    sql += ` LIMIT ${parseInt(limit)} OFFSET ${offset}`;
    const [rows] = await db.query(sql, params);
    return success(res, rows);
  } catch (err) {
    return error(res, err.message);
  }
};

exports.getById = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT m.*, b.name as brand_name, b.code as brand_code,
       f.name as floor_mold_name FROM models m
       LEFT JOIN brands b ON m.brand_id = b.id
       LEFT JOIN floor_molds f ON m.floor_mold_id = f.id
       WHERE m.id = ?`,
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
    const { code, name, brand_id, floor_mold_id = null, description, is_active = true } = req.body;
    if (!code || !name || !brand_id) return error(res, 'code, name, brand_id are required', 400);
    const [result] = await db.query(
      'INSERT INTO models (code, name, brand_id, floor_mold_id, description, is_active) VALUES (?, ?, ?, ?, ?, ?)',
      [code, name, brand_id, floor_mold_id || null, description || null, is_active]
    );
    const [rows] = await db.query(
      `SELECT m.*, b.name as brand_name, f.name as floor_mold_name FROM models m
       LEFT JOIN brands b ON m.brand_id = b.id
       LEFT JOIN floor_molds f ON m.floor_mold_id = f.id WHERE m.id = ?`,
      [result.insertId]
    );
    return success(res, rows[0], 'Created successfully', 201);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return error(res, 'Code already exists for this brand', 409);
    return error(res, err.message);
  }
};

exports.update = async (req, res) => {
  try {
    const { code, name, brand_id, floor_mold_id = null, description, is_active } = req.body;
    const [existing] = await db.query('SELECT * FROM models WHERE id = ?', [req.params.id]);
    if (existing.length === 0) return error(res, 'Not found', 404);

    await db.query(
      'UPDATE models SET code=?, name=?, brand_id=?, floor_mold_id=?, description=?, is_active=? WHERE id=?',
      [code, name, brand_id, floor_mold_id || null, description || null, is_active, req.params.id]
    );
    const [rows] = await db.query(
      `SELECT m.*, b.name as brand_name, f.name as floor_mold_name FROM models m
       LEFT JOIN brands b ON m.brand_id = b.id
       LEFT JOIN floor_molds f ON m.floor_mold_id = f.id WHERE m.id = ?`,
      [req.params.id]
    );
    return success(res, rows[0], 'Updated successfully');
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return error(res, 'Code already exists for this brand', 409);
    return error(res, err.message);
  }
};

exports.remove = async (req, res) => {
  try {
    const [result] = await db.query('UPDATE models SET is_active = 0 WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return error(res, 'Not found', 404);
    return success(res, null, 'Deleted successfully');
  } catch (err) {
    return error(res, err.message);
  }
};
