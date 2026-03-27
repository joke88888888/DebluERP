const router = require('express').Router();
const c = require('../controllers/customerReport.controller');

router.get('/summary', c.getSummary);
router.get('/customers', c.getCustomerList);
router.get('/customers/:id', c.getCustomerDetail);

module.exports = router;
