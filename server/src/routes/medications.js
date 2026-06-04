const express = require('express');
const router = express.Router();
const medicationController = require('../controllers/medicationController');
const { requireAuth, requirePatient } = require('../middleware/requireAuth');

router.use(requireAuth, requirePatient);

router.get('/', medicationController.list);
router.post('/', medicationController.create);
router.delete('/:id', medicationController.remove);
router.post('/:id/log', medicationController.logTaken);

module.exports = router;
