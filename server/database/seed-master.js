require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('../config/db');

async function run() {
  try {
    await db.query('SET FOREIGN_KEY_CHECKS = 0');
    await db.query('TRUNCATE TABLE users');
    await db.query('TRUNCATE TABLE genders');
    await db.query('TRUNCATE TABLE employment_types');
    await db.query('TRUNCATE TABLE positions');
    await db.query('SET FOREIGN_KEY_CHECKS = 1');

    // Positions
    const positions = [
      ['Executive', 'ผู้บริหาร'],
      ['Finance', 'การเงิน'],
      ['HR', 'ทรัพยากรบุคคล'],
      ['Production - Daily', 'ฝ่ายผลิต - รายวัน'],
      ['Production - Monthly', 'ฝ่ายผลิต - รายเดือน'],
      ['Production - Piece Rate', 'ฝ่ายผลิต - รายชิ้น'],
      ['Sales', 'ฝ่ายขาย'],
      ['Sales Manager', 'หัวหน้าฝ่ายขาย'],
    ];
    for (const [name, name_th] of positions) {
      await db.query('INSERT INTO positions (name, name_th) VALUES (?, ?)', [name, name_th]);
    }

    // Employment types
    const types = [
      ['Monthly', 'รายเดือน'],
      ['Daily', 'รายวัน'],
      ['Piece Rate', 'รายชิ้น'],
    ];
    for (const [name, name_th] of types) {
      await db.query('INSERT INTO employment_types (name, name_th) VALUES (?, ?)', [name, name_th]);
    }

    // Genders
    const genders = [
      ['M', 'Male', 'ชาย'],
      ['F', 'Female', 'หญิง'],
      ['U', 'Unisex', 'Unisex'],
    ];
    for (const [code, name, name_th] of genders) {
      await db.query('INSERT INTO genders (code, name, name_th) VALUES (?, ?, ?)', [code, name, name_th]);
    }

    // Admin user
    const hash = bcrypt.hashSync('admin1234', 10);
    await db.query('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)', ['admin', hash, 'admin']);

    console.log('Seed master data OK');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

run();
