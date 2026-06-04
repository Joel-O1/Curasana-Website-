const express = require('express');
const router = express.Router();
const healthEventController = require('../controllers/healthEventController');
const { requireAuth, requirePatient } = require('../middleware/requireAuth');

router.use(requireAuth, requirePatient);

router.get('/', healthEventController.listAllergies);
router.post('/', healthEventController.createAllergy);
router.delete('/:id', healthEventController.deleteAllergy);

module.exports = router;
