const express = require('express');
const router = express.Router();
const healthEventController = require('../controllers/healthEventController');
const { requireAuth, requirePatient } = require('../middleware/requireAuth');

router.use(requireAuth, requirePatient);

router.get('/', healthEventController.listSymptoms);
router.post('/', healthEventController.createSymptom);
router.delete('/:id', healthEventController.deleteSymptom);

module.exports = router;
