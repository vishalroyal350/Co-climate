const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');

router.route('/')
  .get(projectController.getProjects)
  .post(projectController.saveProject);

router.delete('/:id', projectController.deleteProject);

module.exports = router;
