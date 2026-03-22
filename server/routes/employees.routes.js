const router = require('express').Router();
const c = require('../controllers/employees.controller');
const { uploadSingle } = require('../middleware/upload');

router.get('/positions', c.getPositions);
router.get('/employment-types', c.getEmploymentTypes);
router.get('/', c.getAll);
router.get('/:id', c.getById);
router.post('/', uploadSingle('employees/profiles'), c.create);
router.put('/:id', uploadSingle('employees/profiles'), c.update);
router.delete('/:id', c.remove);
router.post('/:id/documents', uploadSingle('employees/documents'), c.uploadDocument);
router.delete('/:id/documents/:docId', c.deleteDocument);
router.post('/:id/profile-image', uploadSingle('employees/profiles'), c.uploadProfileImage);

module.exports = router;
