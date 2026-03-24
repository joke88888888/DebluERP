const db = require('../config/db');
const { success, error } = require('../utils/responseHelper');

exports.getAll = async (req, res) => {
  try {
    const { brand_id, is_active } = req.query;
    let sql = `SELECT f.*, b.name as brand_name, l.name as lid_mold_name FROM floor_molds f
               LEFT JOIN brands b ON f.brand_id = b.id
               LEFT JOIN lid_molds l ON f.lid_mold_id = l.id
               WHERE 1=1`;
    const params = [];
    if (brand_id) { sql += ' AND f.brand_id = ?'; params.push(brand_id); }
    if (is_active !== undefined) { sql += ' AND f.is_active = ?'; params.push(is_active === 'true' || is_active === '1' ? 1 : 0); }
    sql += ' ORDER BY b.name, f.name';
    const [rows] = await db.query(sql, params);
    const parsed = rows.map(r => ({ ...r, sizes: r.sizes ? JSON.parse(r.sizes) : [] }));
    return success(res, parsed);
  } catch (err) {
    return error(res, err.message);
  }
};

exports.getById = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT f.*, b.name as brand_name, l.name as lid_mold_name FROM floor_molds f
       LEFT JOIN brands b ON f.brand_id = b.id
       LEFT JOIN lid_molds l ON f.lid_mold_id = l.id
       WHERE f.id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) return error(res, 'Not found', 404);
    const r = rows[0];
    return success(res, { ...r, sizes: r.sizes ? JSON.parse(r.sizes) : [] });
  } catch (err) {
    return error(res, err.message);
  }
};

exports.create = async (req, res) => {
  try {
    const { brand_id, name, lid_mold_id = null, sizes = [], is_active = true } = req.body;
    if (!brand_id || !name) return error(res, 'brand_id and name are required', 400);
    if (name.length > 5) return error(res, 'name must not exceed 5 characters', 400);
    const sizesJson = JSON.stringify(Array.isArray(sizes) ? sizes : []);
    const [result] = await db.query(
      'INSERT INTO floor_molds (brand_id, name, lid_mold_id, sizes, is_active) VALUES (?, ?, ?, ?, ?)',
      [brand_id, name, lid_mold_id || null, sizesJson, is_active ? 1 : 0]
    );
    const [rows] = await db.query(
      `SELECT f.*, b.name as brand_name, l.name as lid_mold_name FROM floor_molds f
       LEFT JOIN brands b ON f.brand_id = b.id
       LEFT JOIN lid_molds l ON f.lid_mold_id = l.id WHERE f.id = ?`,
      [result.insertId]
    );
    const r = rows[0];
    return success(res, { ...r, sizes: r.sizes ? JSON.parse(r.sizes) : [] }, 'Created successfully', 201);
  } catch (err) {
    return error(res, err.message);
  }
};

exports.update = async (req, res) => {
  try {
    const { brand_id, name, lid_mold_id = null, sizes = [], is_active } = req.body;
    const [existing] = await db.query('SELECT * FROM floor_molds WHERE id = ?', [req.params.id]);
    if (existing.length === 0) return error(res, 'Not found', 404);
    if (name && name.length > 5) return error(res, 'name must not exceed 5 characters', 400);
    const sizesJson = JSON.stringify(Array.isArray(sizes) ? sizes : []);
    await db.query(
      'UPDATE floor_molds SET brand_id=?, name=?, lid_mold_id=?, sizes=?, is_active=? WHERE id=?',
      [brand_id, name, lid_mold_id || null, sizesJson, is_active ? 1 : 0, req.params.id]
    );
    const [rows] = await db.query(
      `SELECT f.*, b.name as brand_name, l.name as lid_mold_name FROM floor_molds f
       LEFT JOIN brands b ON f.brand_id = b.id
       LEFT JOIN lid_molds l ON f.lid_mold_id = l.id WHERE f.id = ?`,
      [req.params.id]
    );
    const r = rows[0];
    return success(res, { ...r, sizes: r.sizes ? JSON.parse(r.sizes) : [] }, 'Updated successfully');
  } catch (err) {
    return error(res, err.message);
  }
};

exports.remove = async (req, res) => {
  try {
    const [result] = await db.query('UPDATE floor_molds SET is_active = 0 WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return error(res, 'Not found', 404);
    return success(res, null, 'Deleted successfully');
  } catch (err) {
    return error(res, err.message);
  }
};
