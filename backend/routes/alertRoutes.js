const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');

router.route('/')
  .get(notificationController.getAlerts)
  .post(notificationController.saveAlert);

router.delete('/:id', notificationController.deleteAlert);

module.exports = router;
