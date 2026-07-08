const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { reviewSchema } = require('../validators/miscValidators');
const { createReview } = require('../controllers/reviewController');

router.post('/', authenticate, authorize('CUSTOMER'), validate(reviewSchema), createReview);

module.exports = router;

export {};
