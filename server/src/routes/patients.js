const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');
const { requireAuth, requirePatient } = require('../middleware/requireAuth');

router.use(requireAuth, requirePatient);
router.get('/me', patientController.getProfile);
router.patch('/me', patientController.updateProfile);

module.exports = router;
