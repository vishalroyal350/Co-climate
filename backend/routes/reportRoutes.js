const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

router.route('/')
  .get(reportController.getReportRequests)
  .post(reportController.createReportRequest);

router.post('/generate', reportController.generateCustomReport);

router.put('/:id', reportController.updateReportRequest);

module.exports = router;
