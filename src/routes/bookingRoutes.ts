const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createBookingSchema } = require('../validators/bookingValidator');
const {
  createBooking,
  getMyBookings,
  getBookingById,
  cancelBooking,
} = require('../controllers/bookingController');

router.use(authenticate);

router.post('/', authorize('CUSTOMER'), validate(createBookingSchema), createBooking);
router.get('/', authorize('CUSTOMER'), getMyBookings);
router.get('/:id', getBookingById); // customer, technician (owner), or admin — checked in controller
router.patch('/:id/cancel', authorize('CUSTOMER'), cancelBooking);

module.exports = router;

export {};
