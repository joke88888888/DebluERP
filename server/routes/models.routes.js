const router = require('express').Router();
const c = require('../controllers/models.controller');
const { uploadSingle } = require('../middleware/upload');

router.get('/', c.getAll);
router.get('/:id', c.getById);
router.post('/', uploadSingle('models'), c.create);
router.put('/:id', uploadSingle('models'), c.update);
router.delete('/:id', c.remove);

module.exports = router;
