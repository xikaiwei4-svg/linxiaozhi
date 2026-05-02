const express = require('express');
const UserController = require('../controllers/UserController');
const ConversationController = require('../controllers/ConversationController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// 用户路由
router.post('/users/register', UserController.register);
router.post('/users/login', UserController.login);
router.get('/users/profile', authMiddleware, UserController.getProfile);
router.put('/users/profile', authMiddleware, UserController.updateProfile);

// 对话路由
router.get('/conversations', authMiddleware, ConversationController.getConversations);
router.post('/conversations', authMiddleware, ConversationController.createConversation);
router.get('/conversations/:id', authMiddleware, ConversationController.getConversation);
router.put('/conversations/:id', authMiddleware, ConversationController.updateConversation);
router.delete('/conversations/:id', authMiddleware, ConversationController.deleteConversation);
router.post('/conversations/:id/messages', authMiddleware, ConversationController.sendMessage);
router.post('/conversations/:id/stream', authMiddleware, ConversationController.sendMessageStream);

// 转接路由（用户请求转人工）
const AgentController = require('../controllers/AgentController');
router.post('/conversations/:id/transfer', authMiddleware, AgentController.transferChat);

// 提示词路由
router.use('/system-prompts', authMiddleware, require('./systemPrompt'));
// 知识库路由
router.use('/knowledge', authMiddleware, require('./knowledge'));
// 坐席路由
router.use('/agents', authMiddleware, require('./agent'));
// 管理员路由
router.use('/admin', authMiddleware, require('./admin'));

module.exports = router;
