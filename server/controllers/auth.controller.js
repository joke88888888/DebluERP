const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { success, error } = require('../utils/responseHelper');

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return error(res, 'Username and password required', 400);
    }

    const [rows] = await db.query(
      'SELECT u.*, e.first_name, e.last_name FROM users u LEFT JOIN employees e ON u.employee_id = e.id WHERE u.username = ? AND u.is_active = 1',
      [username]
    );

    if (rows.length === 0) {
      return error(res, 'Invalid credentials', 401);
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return error(res, 'Invalid credentials', 401);
    }

    await db.query('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]);

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    return success(res, {
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        first_name: user.first_name,
        last_name: user.last_name,
      },
    }, 'Login successful');
  } catch (err) {
    return error(res, err.message);
  }
};

exports.logout = (req, res) => {
  return success(res, null, 'Logged out successfully');
};

exports.me = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT u.id, u.username, u.role, u.last_login, e.first_name, e.last_name FROM users u LEFT JOIN employees e ON u.employee_id = e.id WHERE u.id = ?',
      [req.user.id]
    );
    if (rows.length === 0) return error(res, 'User not found', 404);
    return success(res, rows[0]);
  } catch (err) {
    return error(res, err.message);
  }
};
