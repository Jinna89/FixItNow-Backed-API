const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');
const {
  createPayment,
  confirmPayment,
  getMyPayments,
  getPaymentById,
} = require('../controllers/paymentController');

// SSLCommerz calls this server-to-server (IPN) and via browser redirect — no auth token available.
router.post('/confirm', confirmPayment);
router.get('/confirm', confirmPayment);

router.post('/create', authenticate, authorize('CUSTOMER'), createPayment);
router.get('/', authenticate, getMyPayments);
router.get('/:id', authenticate, getPaymentById);

module.exports = router;

export {};
