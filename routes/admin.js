const express = require('express');
const AdminController = require('../controllers/AdminController');
const adminAuth = require('../middleware/adminAuth');

const router = express.Router();

router.get('/dashboard', adminAuth, AdminController.dashboard);
router.get('/users', adminAuth, AdminController.listUsers);
router.put('/users/:id', adminAuth, AdminController.updateUser);
router.get('/conversations', adminAuth, AdminController.listConversations);

module.exports = router;
