const express = require('express');
const AgentController = require('../controllers/AgentController');

const router = express.Router();

router.get('/me', AgentController.getMe);
router.put('/me/status', AgentController.updateStatus);
router.get('/queue', AgentController.getQueue);
router.post('/conversations/:id/accept', AgentController.acceptChat);
router.post('/conversations/:id/resolve', AgentController.resolveChat);
router.post('/conversations/:id/agent-message', AgentController.agentMessage);

module.exports = router;
