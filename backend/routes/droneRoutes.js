const express = require('express');
const router = express.Router();
const droneController = require('../controllers/droneController');

router.route('/')
  .get(droneController.getDrones)
  .post(droneController.saveDrone);

router.delete('/:id', droneController.deleteDrone);

module.exports = router;
