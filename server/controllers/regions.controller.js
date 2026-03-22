const db = require('../config/db');
const { success, error } = require('../utils/responseHelper');

const getRegionWithProvinces = async (id) => {
  const [regions] = await db.query('SELECT * FROM regions WHERE id = ?', [id]);
  if (regions.length === 0) return null;
  const [provinces] = await db.query(
    `SELECT p.* FROM provinces p
     INNER JOIN region_provinces rp ON p.id = rp.province_id
     WHERE rp.region_id = ? ORDER BY p.name_th`,
    [id]
  );
  return { ...regions[0], provinces };
};

exports.getAll = async (req, res) => {
  try {
    const [regions] = await db.query('SELECT * FROM regions ORDER BY name_th');
    const result = await Promise.all(
      regions.map(async (r) => {
        const [provinces] = await db.query(
          `SELECT p.* FROM provinces p
           INNER JOIN region_provinces rp ON p.id = rp.province_id
           WHERE rp.region_id = ? ORDER BY p.name_th`,
          [r.id]
        );
        return { ...r, provinces };
      })
    );
    return success(res, result);
  } catch (err) {
    return error(res, err.message);
  }
};

exports.getById = async (req, res) => {
  try {
    const region = await getRegionWithProvinces(req.params.id);
    if (!region) return error(res, 'Not found', 404);
    return success(res, region);
  } catch (err) {
    return error(res, err.message);
  }
};

exports.create = async (req, res) => {
  try {
    const { name, name_th, description, is_active = true, province_ids = [] } = req.body;
    if (!name || !name_th) return error(res, 'name, name_th are required', 400);
    const [result] = await db.query(
      'INSERT INTO regions (name, name_th, description, is_active) VALUES (?, ?, ?, ?)',
      [name, name_th, description || null, is_active]
    );
    const regionId = result.insertId;
    if (province_ids.length > 0) {
      const values = province_ids.map((pid) => [regionId, pid]);
      await db.query('INSERT INTO region_provinces (region_id, province_id) VALUES ?', [values]);
    }
    const region = await getRegionWithProvinces(regionId);
    return success(res, region, 'Created successfully', 201);
  } catch (err) {
    return error(res, err.message);
  }
};

exports.update = async (req, res) => {
  try {
    const { name, name_th, description, is_active, province_ids = [] } = req.body;
    const [existing] = await db.query('SELECT * FROM regions WHERE id = ?', [req.params.id]);
    if (existing.length === 0) return error(res, 'Not found', 404);

    await db.query(
      'UPDATE regions SET name=?, name_th=?, description=?, is_active=? WHERE id=?',
      [name, name_th, description || null, is_active, req.params.id]
    );
    await db.query('DELETE FROM region_provinces WHERE region_id = ?', [req.params.id]);
    if (province_ids.length > 0) {
      const values = province_ids.map((pid) => [req.params.id, pid]);
      await db.query('INSERT INTO region_provinces (region_id, province_id) VALUES ?', [values]);
    }
    const region = await getRegionWithProvinces(req.params.id);
    return success(res, region, 'Updated successfully');
  } catch (err) {
    return error(res, err.message);
  }
};

exports.remove = async (req, res) => {
  try {
    const [result] = await db.query('UPDATE regions SET is_active = 0 WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return error(res, 'Not found', 404);
    return success(res, null, 'Deleted successfully');
  } catch (err) {
    return error(res, err.message);
  }
};
