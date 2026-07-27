const express = require('express');
const router = express.Router();
const monitoringController = require('../controllers/monitoringController');

router.route('/')
  .get(monitoringController.getMonitoring)
  .post(monitoringController.saveMonitoring);

router.delete('/:id', monitoringController.deleteMonitoring);

module.exports = router;
