const router = require('express').Router();
const {
  getServices,
  getTechnicians,
  getTechnicianById,
  getCategories,
} = require('../controllers/serviceController');

router.get('/services', getServices);
router.get('/technicians', getTechnicians);
router.get('/technicians/:id', getTechnicianById);
router.get('/categories', getCategories);

module.exports = router;

export {};
