const express = require('express');
const router = express.Router();
const timelineController = require('../controllers/timelineController');
const { requireAuth, requirePatient } = require('../middleware/requireAuth');

router.use(requireAuth, requirePatient);
router.get('/', timelineController.list);

module.exports = router;
