const express = require('express');
const router = express.Router();
const milestoneController = require('../controllers/milestoneController');

router.route('/')
  .get(milestoneController.getMilestones)
  .post(milestoneController.saveMilestone);

router.delete('/:id', milestoneController.deleteMilestone);

module.exports = router;
