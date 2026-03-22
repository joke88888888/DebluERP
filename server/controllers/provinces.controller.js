const db = require('../config/db');
const { success, error } = require('../utils/responseHelper');

exports.getAll = async (req, res) => {
  try {
    const { q } = req.query;
    let sql = 'SELECT * FROM provinces WHERE 1=1';
    const params = [];
    if (q) {
      sql += ' AND (name_th LIKE ? OR name_en LIKE ?)';
      params.push(`%${q}%`, `%${q}%`);
    }
    sql += ' ORDER BY name_th';
    const [rows] = await db.query(sql, params);
    return success(res, rows);
  } catch (err) {
    return error(res, err.message);
  }
};
