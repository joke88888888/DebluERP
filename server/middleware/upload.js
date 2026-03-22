const multer = require('multer');
const path = require('path');
const fs = require('fs');

const createStorage = (folder) =>
  multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = path.join(__dirname, '..', 'uploads', folder);
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    },
  });

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp|pdf|doc|docx/;
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.test(ext.slice(1))) {
    cb(null, true);
  } else {
    cb(new Error('File type not allowed'), false);
  }
};

const uploadSingle = (folder) =>
  multer({ storage: createStorage(folder), fileFilter, limits: { fileSize: 5 * 1024 * 1024 } }).single('file');

const uploadMultiple = (folder, maxCount = 10) =>
  multer({ storage: createStorage(folder), fileFilter, limits: { fileSize: 5 * 1024 * 1024 } }).array('files', maxCount);

const uploadFields = (fields) => {
  // fields: [{ name, folder, maxCount }]
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const field = fields.find((f) => f.name === file.fieldname);
      const folder = field ? field.folder : 'misc';
      const dir = path.join(__dirname, '..', 'uploads', folder);
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    },
  });
  const multerFields = fields.map((f) => ({ name: f.name, maxCount: f.maxCount || 1 }));
  return multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } }).fields(multerFields);
};

module.exports = { uploadSingle, uploadMultiple, uploadFields };
