const express = require('express');
const router = express.Router();
const siteController = require('../controllers/siteController');

router.route('/')
  .get(siteController.getSites)
  .post(siteController.saveSite);

router.delete('/:id', siteController.deleteSite);

module.exports = router;
