const db = require('../config/db');
const { success, error } = require('../utils/responseHelper');
const path = require('path');
const fs = require('fs');

exports.getAll = async (req, res) => {
  try {
    const { q, is_active, page = 1, limit = 50 } = req.query;
    let sql = 'SELECT * FROM brands WHERE 1=1';
    const params = [];
    if (q) { sql += ' AND name LIKE ?'; params.push(`%${q}%`); }
    if (is_active !== undefined) { sql += ' AND is_active = ?'; params.push(is_active === 'true' || is_active === '1' ? 1 : 0); }
    sql += ' ORDER BY name';
    const offset = (parseInt(page) - 1) * parseInt(limit);
    sql += ` LIMIT ${parseInt(limit)} OFFSET ${offset}`;
    const [rows] = await db.query(sql, params);
    const countSql = 'SELECT COUNT(*) as total FROM brands WHERE 1=1' + (q ? ' AND name LIKE ?' : '') + (is_active !== undefined ? ' AND is_active = ?' : '');
    const [countResult] = await db.query(countSql, params);
    return res.json({ success: true, data: rows, total: countResult[0].total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    return error(res, err.message);
  }
};

exports.getById = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM brands WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return error(res, 'Not found', 404);
    return success(res, rows[0]);
  } catch (err) {
    return error(res, err.message);
  }
};

exports.create = async (req, res) => {
  try {
    const { code, name, description, is_active = true } = req.body;
    if (!code || !name) return error(res, 'code, name are required', 400);
    const logo_image = req.file ? `brands/${req.file.filename}` : null;
    const [result] = await db.query(
      'INSERT INTO brands (code, name, logo_image, description, is_active) VALUES (?, ?, ?, ?, ?)',
      [code, name, logo_image, description || null, is_active]
    );
    const [rows] = await db.query('SELECT * FROM brands WHERE id = ?', [result.insertId]);
    return success(res, rows[0], 'Created successfully', 201);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return error(res, 'Code already exists', 409);
    return error(res, err.message);
  }
};

exports.update = async (req, res) => {
  try {
    const { code, name, description, is_active } = req.body;
    const [existing] = await db.query('SELECT * FROM brands WHERE id = ?', [req.params.id]);
    if (existing.length === 0) return error(res, 'Not found', 404);

    let logo_image = existing[0].logo_image;
    if (req.file) {
      if (logo_image) {
        const oldPath = path.join(__dirname, '..', 'uploads', logo_image);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      logo_image = `brands/${req.file.filename}`;
    }

    await db.query(
      'UPDATE brands SET code=?, name=?, logo_image=?, description=?, is_active=? WHERE id=?',
      [code, name, logo_image, description || null, is_active, req.params.id]
    );
    const [rows] = await db.query('SELECT * FROM brands WHERE id = ?', [req.params.id]);
    return success(res, rows[0], 'Updated successfully');
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return error(res, 'Code already exists', 409);
    return error(res, err.message);
  }
};

exports.remove = async (req, res) => {
  try {
    const [result] = await db.query('UPDATE brands SET is_active = 0 WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return error(res, 'Not found', 404);
    return success(res, null, 'Deleted successfully');
  } catch (err) {
    return error(res, err.message);
  }
};
