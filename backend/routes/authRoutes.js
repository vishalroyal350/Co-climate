const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Standard user management endpoints
router.post('/login', authController.authenticateUser);
router.post('/register', authController.registerUser);

router.route('/users')
  .get(authController.getUsers)
  .post(authController.registerUser);

router.route('/users/:id')
  .get(authController.getUserById)
  .put(authController.updateUser)
  .delete(authController.deleteUser);

module.exports = router;
