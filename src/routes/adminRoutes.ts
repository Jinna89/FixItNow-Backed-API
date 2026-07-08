const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { userStatusSchema, categorySchema } = require('../validators/miscValidators');
const {
  getAllUsers,
  updateUserStatus,
  getAllBookings,
  getAllCategories,
  createCategory,
} = require('../controllers/adminController');

router.use(authenticate, authorize('ADMIN'));

router.get('/users', getAllUsers);
router.patch('/users/:id', validate(userStatusSchema), updateUserStatus);
router.get('/bookings', getAllBookings);
router.get('/categories', getAllCategories);
router.post('/categories', validate(categorySchema), createCategory);

module.exports = router;

export {};
