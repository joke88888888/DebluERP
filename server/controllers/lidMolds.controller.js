const db = require('../config/db');
const { success, error } = require('../utils/responseHelper');

const parseSizes = (sizes) => {
  if (!sizes) return [];
  if (Array.isArray(sizes)) return sizes;          // already parsed by MySQL JSON column
  if (typeof sizes === 'string') return JSON.parse(sizes);
  return [];
};

exports.getAll = async (req, res) => {
  try {
    const { brand_id, is_active } = req.query;
    let sql = `SELECT l.*, b.name as brand_name FROM lid_molds l
               LEFT JOIN brands b ON l.brand_id = b.id WHERE 1=1`;
    const params = [];
    if (brand_id) { sql += ' AND l.brand_id = ?'; params.push(brand_id); }
    if (is_active !== undefined) { sql += ' AND l.is_active = ?'; params.push(is_active === 'true' || is_active === '1' ? 1 : 0); }
    sql += ' ORDER BY b.name, l.name';
    const [rows] = await db.query(sql, params);
    const parsed = rows.map(r => ({ ...r, sizes: parseSizes(r.sizes) }));
    return success(res, parsed);
  } catch (err) {
    return error(res, err.message);
  }
};

exports.getById = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT l.*, b.name as brand_name FROM lid_molds l
       LEFT JOIN brands b ON l.brand_id = b.id WHERE l.id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) return error(res, 'Not found', 404);
    const r = rows[0];
    return success(res, { ...r, sizes: parseSizes(r.sizes) });
  } catch (err) {
    return error(res, err.message);
  }
};

exports.create = async (req, res) => {
  try {
    const { brand_id, name, sizes = [], is_active = true } = req.body;
    if (!brand_id || !name) return error(res, 'brand_id and name are required', 400);
    if (name.length > 20) return error(res, 'name must not exceed 20 characters', 400);
    const sizesArr = Array.isArray(sizes) ? sizes : (typeof sizes === 'string' ? JSON.parse(sizes) : []);
    const sizesJson = JSON.stringify(sizesArr);
    const [result] = await db.query(
      'INSERT INTO lid_molds (brand_id, name, sizes, is_active) VALUES (?, ?, ?, ?)',
      [brand_id, name, sizesJson, is_active ? 1 : 0]
    );
    const [rows] = await db.query(
      'SELECT l.*, b.name as brand_name FROM lid_molds l LEFT JOIN brands b ON l.brand_id = b.id WHERE l.id = ?',
      [result.insertId]
    );
    const r = rows[0];
    return success(res, { ...r, sizes: parseSizes(r.sizes) }, 'Created successfully', 201);
  } catch (err) {
    return error(res, err.message);
  }
};

exports.update = async (req, res) => {
  try {
    const { brand_id, name, sizes = [], is_active } = req.body;
    const [existing] = await db.query('SELECT * FROM lid_molds WHERE id = ?', [req.params.id]);
    if (existing.length === 0) return error(res, 'Not found', 404);
    if (name && name.length > 20) return error(res, 'name must not exceed 20 characters', 400);
    const sizesArr = Array.isArray(sizes) ? sizes : (typeof sizes === 'string' ? JSON.parse(sizes) : []);
    const sizesJson = JSON.stringify(sizesArr);
    await db.query(
      'UPDATE lid_molds SET brand_id=?, name=?, sizes=?, is_active=? WHERE id=?',
      [brand_id, name, sizesJson, is_active ? 1 : 0, req.params.id]
    );
    const [rows] = await db.query(
      'SELECT l.*, b.name as brand_name FROM lid_molds l LEFT JOIN brands b ON l.brand_id = b.id WHERE l.id = ?',
      [req.params.id]
    );
    const r = rows[0];
    return success(res, { ...r, sizes: parseSizes(r.sizes) }, 'Updated successfully');
  } catch (err) {
    return error(res, err.message);
  }
};

exports.remove = async (req, res) => {
  try {
    const [result] = await db.query('UPDATE lid_molds SET is_active = 0 WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return error(res, 'Not found', 404);
    return success(res, null, 'Deleted successfully');
  } catch (err) {
    return error(res, err.message);
  }
};
