const router = require('express').Router();
const c = require('../controllers/customers.controller');
const { uploadSingle } = require('../middleware/upload');

router.get('/', c.getAll);
router.get('/:id', c.getById);
router.post('/', c.create);
router.put('/:id', c.update);
router.delete('/:id', c.remove);
router.post('/:id/documents', uploadSingle('customers/documents'), c.uploadDocument);
router.delete('/:id/documents/:docId', c.deleteDocument);

module.exports = router;
