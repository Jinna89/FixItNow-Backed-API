const router = require('express').Router();
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const { registerSchema, loginSchema, refreshSchema } = require('../validators/authValidator');
const { register, login, refresh, logout, me } = require('../controllers/authController');

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/refresh', validate(refreshSchema), refresh);
router.post('/logout', logout);
router.get('/me', authenticate, me);

module.exports = router;

export {};
