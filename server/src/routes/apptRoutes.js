const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const getAppointments = require('../controllers/apptController');

router.get('/appointments', authMiddleware, getAppointments); //use the auth middleware to protect this route and ones that require a user to be logged in

module.exports = router;