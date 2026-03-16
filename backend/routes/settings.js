const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');

// Global COD settings
router.get('/cod', settingsController.getGlobalCodSetting);
router.put('/cod', express.json(), settingsController.updateGlobalCodSetting);

module.exports = router;
