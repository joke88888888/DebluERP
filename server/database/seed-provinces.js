require('dotenv').config();
const db = require('../config/db');

const provinces = [
  ['กรุงเทพมหานคร','Bangkok'],['กระบี่','Krabi'],['กาญจนบุรี','Kanchanaburi'],
  ['กาฬสินธุ์','Kalasin'],['กำแพงเพชร','Kamphaeng Phet'],['ขอนแก่น','Khon Kaen'],
  ['จันทบุรี','Chanthaburi'],['ฉะเชิงเทรา','Chachoengsao'],['ชลบุรี','Chonburi'],
  ['ชัยนาท','Chainat'],['ชัยภูมิ','Chaiyaphum'],['ชุมพร','Chumphon'],
  ['เชียงราย','Chiang Rai'],['เชียงใหม่','Chiang Mai'],['ตรัง','Trang'],
  ['ตราด','Trat'],['ตาก','Tak'],['นครนายก','Nakhon Nayok'],
  ['นครปฐม','Nakhon Pathom'],['นครพนม','Nakhon Phanom'],['นครราชสีมา','Nakhon Ratchasima'],
  ['นครศรีธรรมราช','Nakhon Si Thammarat'],['นครสวรรค์','Nakhon Sawan'],['นนทบุรี','Nonthaburi'],
  ['นราธิวาส','Narathiwat'],['น่าน','Nan'],['บึงกาฬ','Bueng Kan'],
  ['บุรีรัมย์','Buriram'],['ปทุมธานี','Pathum Thani'],['ประจวบคีรีขันธ์','Prachuap Khiri Khan'],
  ['ปราจีนบุรี','Prachinburi'],['ปัตตานี','Pattani'],['พระนครศรีอยุธยา','Phra Nakhon Si Ayutthaya'],
  ['พะเยา','Phayao'],['พังงา','Phang Nga'],['พัทลุง','Phatthalung'],
  ['พิจิตร','Phichit'],['พิษณุโลก','Phitsanulok'],['เพชรบุรี','Phetchaburi'],
  ['เพชรบูรณ์','Phetchabun'],['แพร่','Phrae'],['ภูเก็ต','Phuket'],
  ['มหาสารคาม','Maha Sarakham'],['มุกดาหาร','Mukdahan'],['แม่ฮ่องสอน','Mae Hong Son'],
  ['ยโสธร','Yasothon'],['ยะลา','Yala'],['ร้อยเอ็ด','Roi Et'],
  ['ระนอง','Ranong'],['ระยอง','Rayong'],['ราชบุรี','Ratchaburi'],
  ['ลพบุรี','Lopburi'],['ลำปาง','Lampang'],['ลำพูน','Lamphun'],
  ['เลย','Loei'],['ศรีสะเกษ','Sisaket'],['สกลนคร','Sakon Nakhon'],
  ['สงขลา','Songkhla'],['สตูล','Satun'],['สมุทรปราการ','Samut Prakan'],
  ['สมุทรสงคราม','Samut Songkhram'],['สมุทรสาคร','Samut Sakhon'],['สระแก้ว','Sa Kaeo'],
  ['สระบุรี','Saraburi'],['สิงห์บุรี','Singburi'],['สุโขทัย','Sukhothai'],
  ['สุพรรณบุรี','Suphan Buri'],['สุราษฎร์ธานี','Surat Thani'],['สุรินทร์','Surin'],
  ['หนองคาย','Nong Khai'],['หนองบัวลำภู','Nong Bua Lamphu'],['อ่างทอง','Ang Thong'],
  ['อำนาจเจริญ','Amnat Charoen'],['อุดรธานี','Udon Thani'],['อุตรดิตถ์','Uttaradit'],
  ['อุทัยธานี','Uthai Thani'],['อุบลราชธานี','Ubon Ratchathani'],
];

async function run() {
  try {
    await db.query('SET FOREIGN_KEY_CHECKS = 0');
    await db.query('TRUNCATE TABLE region_provinces');
    await db.query('TRUNCATE TABLE provinces');
    await db.query('SET FOREIGN_KEY_CHECKS = 1');
    for (const [name_th, name_en] of provinces) {
      await db.query('INSERT INTO provinces (name_th, name_en) VALUES (?, ?)', [name_th, name_en]);
    }
    console.log(`Inserted ${provinces.length} provinces OK`);
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

run();
