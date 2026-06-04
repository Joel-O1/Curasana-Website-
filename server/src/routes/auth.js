const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { validateRegister, validateLogin } = require('../middleware/validateAuth');
const { requireAuth } = require('../middleware/requireAuth');

router.post('/register', validateRegister, authController.register);
router.post('/login', validateLogin, authController.login);
router.get('/me', requireAuth, authController.me);

module.exports = router;
