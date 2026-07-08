const router = require('express').Router();

router.use('/auth', require('./authRoutes'));
router.use('/', require('./serviceRoutes')); // /services, /technicians, /categories
router.use('/technician', require('./technicianRoutes'));
router.use('/bookings', require('./bookingRoutes'));
router.use('/payments', require('./paymentRoutes'));
router.use('/reviews', require('./reviewRoutes'));
router.use('/admin', require('./adminRoutes'));

module.exports = router;

export {};
