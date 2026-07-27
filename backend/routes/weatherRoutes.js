const express = require('express');
const router = express.Router();
const weatherController = require('../controllers/weatherController');

router.get('/history/:projectId', weatherController.getWeatherHistory);
router.post('/', weatherController.saveWeather);

module.exports = router;
