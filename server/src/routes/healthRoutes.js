const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const getHealthEvents = require('../controllers/healthEventController');

router.get('/healthevents', authMiddleware, getHealthEvents); //use the auth middleware to protect this route and ones that require a user to be logged in

module.exports = router;