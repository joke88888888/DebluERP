const router = require('express').Router();
const c = require('../controllers/products.controller');
const { uploadMultiple } = require('../middleware/upload');

router.get('/check-sku/:sku', c.checkSku);
router.get('/', c.getAll);
router.get('/:id', c.getById);
router.post('/', uploadMultiple('products'), c.create);
router.put('/:id', c.update);
router.delete('/:id', c.remove);
router.post('/:id/images', uploadMultiple('products'), c.uploadImages);
router.delete('/:id/images/:imgId', c.deleteImage);

module.exports = router;
