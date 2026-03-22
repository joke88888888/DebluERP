const router = require('express').Router();
const c = require('../controllers/brands.controller');
const { uploadSingle } = require('../middleware/upload');

router.get('/', c.getAll);
router.get('/:id', c.getById);
router.post('/', uploadSingle('brands'), c.create);
router.put('/:id', uploadSingle('brands'), c.update);
router.delete('/:id', c.remove);

module.exports = router;
