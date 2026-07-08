const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  technicianProfileSchema,
  availabilitySchema,
  serviceSchema,
} = require('../validators/miscValidators');
const { updateBookingStatusSchema } = require('../validators/bookingValidator');
const {
  updateProfile,
  createService,
  updateService,
  updateAvailability,
  getOwnBookings,
  updateBookingStatus,
} = require('../controllers/technicianController');

router.use(authenticate, authorize('TECHNICIAN'));

router.put('/profile', validate(technicianProfileSchema), updateProfile);
router.post('/services', validate(serviceSchema), createService);
router.put('/services/:id', validate(serviceSchema), updateService);
router.put('/availability', validate(availabilitySchema), updateAvailability);
router.get('/bookings', getOwnBookings);
router.patch('/bookings/:id', validate(updateBookingStatusSchema), updateBookingStatus);

module.exports = router;

export {};
