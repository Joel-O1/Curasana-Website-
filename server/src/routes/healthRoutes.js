const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { getHealthEvents, getPrescriptions } = require('../controllers/healthEventController');

router.get('/health/events', authMiddleware, getHealthEvents); //use the auth middleware to protect this route and ones that require a user to be logged in
//router.get('/health/score', authMiddleware, getHealthEvents); //use the auth middleware to protect this route and ones that require a user to be logged in
router.get('/health/prescriptions', authMiddleware, getPrescriptions); //use the auth middleware to protect this route and ones that require a user to be logged in


module.exports = router;