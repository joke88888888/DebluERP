const db = require('../config/db');
const { success, error } = require('../utils/responseHelper');
const { generateSKU } = require('../utils/skuGenerator');
const path = require('path');
const fs = require('fs');

const getMasterCodes = async (brand_id, production_method_id, gender_id, model_id, version_id, product_category_id, color_id, size_id) => {
  const [[brand]] = await db.query('SELECT code FROM brands WHERE id = ?', [brand_id]);
  const [[pm]] = await db.query('SELECT code FROM production_methods WHERE id = ?', [production_method_id]);
  const [[gender]] = await db.query('SELECT code FROM genders WHERE id = ?', [gender_id]);
  const [[model]] = await db.query('SELECT code, name FROM models WHERE id = ?', [model_id]);
  const [[version]] = await db.query('SELECT code FROM versions WHERE id = ?', [version_id]);
  const [[cat]] = await db.query('SELECT code FROM product_categories WHERE id = ?', [product_category_id]);
  const [[color]] = await db.query('SELECT code, name FROM colors WHERE id = ?', [color_id]);
  const [[size]] = await db.query('SELECT code, size_value FROM sizes WHERE id = ?', [size_id]);
  const [[brandFull]] = await db.query('SELECT name FROM brands WHERE id = ?', [brand_id]);
  return { brand, pm, gender, model, version, cat, color, size, brandName: brandFull.name };
};

exports.checkSku = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id FROM products WHERE sku = ?', [req.params.sku]);
    return success(res, { exists: rows.length > 0 });
  } catch (err) {
    return error(res, err.message);
  }
};

exports.getAll = async (req, res) => {
  try {
    const { brand_id, model_id, color_id, size_id, gender_id, is_active, q, page = 1, limit = 25 } = req.query;
    let sql = `SELECT p.*,
               b.name as brand_name, b.code as brand_code,
               m.name as model_name, m.code as model_code,
               v.name as version_name,
               pc.name as category_name,
               pm.name as production_method_name,
               g.name as gender_name,
               c.name as color_name, c.hex_code,
               s.size_value, s.size_system,
               pi.image_path as primary_image
               FROM products p
               LEFT JOIN brands b ON p.brand_id = b.id
               LEFT JOIN models m ON p.model_id = m.id
               LEFT JOIN versions v ON p.version_id = v.id
               LEFT JOIN product_categories pc ON p.product_category_id = pc.id
               LEFT JOIN production_methods pm ON p.production_method_id = pm.id
               LEFT JOIN genders g ON p.gender_id = g.id
               LEFT JOIN colors c ON p.color_id = c.id
               LEFT JOIN sizes s ON p.size_id = s.id
               LEFT JOIN product_images pi ON pi.product_id = p.id AND pi.is_primary = 1
               WHERE 1=1`;
    const params = [];
    if (brand_id) { sql += ' AND p.brand_id = ?'; params.push(brand_id); }
    if (model_id) { sql += ' AND p.model_id = ?'; params.push(model_id); }
    if (color_id) { sql += ' AND p.color_id = ?'; params.push(color_id); }
    if (size_id) { sql += ' AND p.size_id = ?'; params.push(size_id); }
    if (gender_id) { sql += ' AND p.gender_id = ?'; params.push(gender_id); }
    if (is_active !== undefined) { sql += ' AND p.is_active = ?'; params.push(is_active === 'true' || is_active === '1' ? 1 : 0); }
    if (q) { sql += ' AND (p.sku LIKE ? OR p.product_name LIKE ?)'; params.push(`%${q}%`, `%${q}%`); }

    const countSql = 'SELECT COUNT(*) as total FROM products p WHERE 1=1' +
      (brand_id ? ' AND p.brand_id = ?' : '') +
      (model_id ? ' AND p.model_id = ?' : '') +
      (color_id ? ' AND p.color_id = ?' : '') +
      (size_id ? ' AND p.size_id = ?' : '') +
      (gender_id ? ' AND p.gender_id = ?' : '') +
      (is_active !== undefined ? ' AND p.is_active = ?' : '') +
      (q ? ' AND (p.sku LIKE ? OR p.product_name LIKE ?)' : '');
    const [countResult] = await db.query(countSql, params);
    const total = countResult[0].total;

    sql += ' ORDER BY p.sku';
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
      `SELECT p.*,
       b.name as brand_name, b.code as brand_code,
       m.name as model_name, m.code as model_code,
       v.name as version_name, v.code as version_code,
       pc.name as category_name, pc.code as category_code,
       pm.name as production_method_name, pm.code as production_method_code,
       g.name as gender_name, g.code as gender_code,
       c.name as color_name, c.code as color_code, c.hex_code,
       s.size_value, s.size_system, s.code as size_code
       FROM products p
       LEFT JOIN brands b ON p.brand_id = b.id
       LEFT JOIN models m ON p.model_id = m.id
       LEFT JOIN versions v ON p.version_id = v.id
       LEFT JOIN product_categories pc ON p.product_category_id = pc.id
       LEFT JOIN production_methods pm ON p.production_method_id = pm.id
       LEFT JOIN genders g ON p.gender_id = g.id
       LEFT JOIN colors c ON p.color_id = c.id
       LEFT JOIN sizes s ON p.size_id = s.id
       WHERE p.id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) return error(res, 'Not found', 404);
    const [images] = await db.query('SELECT * FROM product_images WHERE product_id = ? ORDER BY sort_order', [req.params.id]);
    return success(res, { ...rows[0], images });
  } catch (err) {
    return error(res, err.message);
  }
};

exports.create = async (req, res) => {
  try {
    const {
      brand_id, model_id, version_id, product_category_id, production_method_id,
      gender_id, color_id, size_id, cost_price = 0, selling_price = 0, is_active = true
    } = req.body;
    if (!brand_id || !model_id || !version_id || !product_category_id || !production_method_id || !gender_id || !color_id || !size_id) {
      return error(res, 'All master data fields are required', 400);
    }

    const masters = await getMasterCodes(brand_id, production_method_id, gender_id, model_id, version_id, product_category_id, color_id, size_id);
    const sku = generateSKU({
      brandCode: masters.brand.code,
      productionMethodCode: masters.pm.code,
      genderCode: masters.gender.code,
      modelCode: masters.model.code,
      versionCode: masters.version.code,
      categoryCode: masters.cat.code,
      colorCode: masters.color.code,
      sizeCode: masters.size.code,
    });
    const product_name = `${masters.brandName} ${masters.model.name} ${masters.color.name} Size ${masters.size.size_value}`;

    const [result] = await db.query(
      `INSERT INTO products (sku, brand_id, model_id, version_id, product_category_id, production_method_id,
       gender_id, color_id, size_id, product_name, cost_price, selling_price, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [sku, brand_id, model_id, version_id, product_category_id, production_method_id,
       gender_id, color_id, size_id, product_name, cost_price, selling_price, is_active]
    );
    const productId = result.insertId;

    if (req.files && req.files.length > 0) {
      for (let i = 0; i < req.files.length; i++) {
        const image_path = `products/${req.files[i].filename}`;
        await db.query(
          'INSERT INTO product_images (product_id, image_path, is_primary, sort_order) VALUES (?, ?, ?, ?)',
          [productId, image_path, i === 0 ? 1 : 0, i]
        );
      }
    }

    const [rows] = await db.query('SELECT * FROM products WHERE id = ?', [productId]);
    return success(res, rows[0], 'Created successfully', 201);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return error(res, 'Product combination already exists', 409);
    return error(res, err.message);
  }
};

exports.update = async (req, res) => {
  try {
    const {
      brand_id, model_id, version_id, product_category_id, production_method_id,
      gender_id, color_id, size_id, cost_price, selling_price, is_active
    } = req.body;
    const [existing] = await db.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
    if (existing.length === 0) return error(res, 'Not found', 404);

    const masters = await getMasterCodes(brand_id, production_method_id, gender_id, model_id, version_id, product_category_id, color_id, size_id);
    const sku = generateSKU({
      brandCode: masters.brand.code,
      productionMethodCode: masters.pm.code,
      genderCode: masters.gender.code,
      modelCode: masters.model.code,
      versionCode: masters.version.code,
      categoryCode: masters.cat.code,
      colorCode: masters.color.code,
      sizeCode: masters.size.code,
    });
    const product_name = `${masters.brandName} ${masters.model.name} ${masters.color.name} Size ${masters.size.size_value}`;

    await db.query(
      `UPDATE products SET sku=?, brand_id=?, model_id=?, version_id=?, product_category_id=?,
       production_method_id=?, gender_id=?, color_id=?, size_id=?, product_name=?,
       cost_price=?, selling_price=?, is_active=? WHERE id=?`,
      [sku, brand_id, model_id, version_id, product_category_id, production_method_id,
       gender_id, color_id, size_id, product_name, cost_price, selling_price, is_active, req.params.id]
    );
    const [rows] = await db.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
    return success(res, rows[0], 'Updated successfully');
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return error(res, 'Product combination already exists', 409);
    return error(res, err.message);
  }
};

exports.remove = async (req, res) => {
  try {
    const [result] = await db.query('UPDATE products SET is_active = 0 WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return error(res, 'Not found', 404);
    return success(res, null, 'Deleted successfully');
  } catch (err) {
    return error(res, err.message);
  }
};

exports.uploadImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) return error(res, 'Files required', 400);
    const [existing] = await db.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
    if (existing.length === 0) return error(res, 'Product not found', 404);
    const [lastImg] = await db.query('SELECT MAX(sort_order) as max FROM product_images WHERE product_id = ?', [req.params.id]);
    let sortOrder = (lastImg[0].max || -1) + 1;
    const inserted = [];
    for (const file of req.files) {
      const image_path = `products/${file.filename}`;
      const [r] = await db.query(
        'INSERT INTO product_images (product_id, image_path, is_primary, sort_order) VALUES (?, ?, ?, ?)',
        [req.params.id, image_path, 0, sortOrder++]
      );
      inserted.push({ id: r.insertId, image_path });
    }
    return success(res, inserted, 'Images uploaded', 201);
  } catch (err) {
    return error(res, err.message);
  }
};

exports.deleteImage = async (req, res) => {
  try {
    const [imgs] = await db.query('SELECT * FROM product_images WHERE id = ? AND product_id = ?', [req.params.imgId, req.params.id]);
    if (imgs.length === 0) return error(res, 'Not found', 404);
    const filePath = path.join(__dirname, '..', 'uploads', imgs[0].image_path);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    await db.query('DELETE FROM product_images WHERE id = ?', [req.params.imgId]);
    return success(res, null, 'Image deleted');
  } catch (err) {
    return error(res, err.message);
  }
};
