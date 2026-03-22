const router = require('express').Router();
const c = require('../controllers/provinces.controller');

router.get('/', c.getAll);

module.exports = router;
