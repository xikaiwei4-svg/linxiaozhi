const Agent = require('../models/Agent');
const Conversation = require('../models/Conversation');
const User = require('../models/User');

class AgentController {
  async getMe(req, res) {
    try {
      let agent = await Agent.findOne({ userId: req.user.userId }).populate('userId', 'username email');
      if (!agent) {
        const user = await User.findById(req.user.userId);
        if (user.role !== 'agent') {
          return res.status(403).json({ message: '您不是坐席' });
        }
        agent = new Agent({ userId: req.user.userId, skills: ['forestry'] });
        await agent.save();
      }
      res.json({ agent });
    } catch (error) {
      res.status(500).json({ message: '获取坐席信息失败' });
    }
  }

  async updateStatus(req, res) {
    try {
      const { status } = req.body;
      let agent = await Agent.findOne({ userId: req.user.userId });
      if (!agent) return res.status(404).json({ message: '坐席信息不存在' });
      agent.status = status;
      if (status === 'online') agent.lastActiveAt = new Date();
      await agent.save();
      res.json({ message: '状态更新成功', agent });
    } catch (error) {
      res.status(500).json({ message: '更新状态失败' });
    }
  }

  async getQueue(req, res) {
    try {
      const conversations = await Conversation.find({
        status: 'active',
        agentId: null,
        'messages.role': 'system'
      }).populate('userId', 'username').sort({ 'metadata.lastActive': -1 }).limit(20);

      const queue = conversations.map(c => ({
        id: c._id,
        title: c.title,
        user: c.userId?.username || '未知用户',
        lastActive: c.metadata.lastActive,
        messageCount: c.messages.length
      }));

      res.json({ queue });
    } catch (error) {
      res.status(500).json({ message: '获取队列失败' });
    }
  }

  async transferChat(req, res) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const conversation = await Conversation.findOne({ _id: id, userId: req.user.userId });
      if (!conversation) return res.status(404).json({ message: '对话不存在' });

      conversation.addMessage('system', `用户请求转接人工服务。原因: ${reason || '未提供'}`);
      conversation.status = 'active';
      await conversation.save();

      res.json({ message: '已请求转接人工服务，请稍候。' });
    } catch (error) {
      res.status(500).json({ message: '转接失败' });
    }
  }

  async acceptChat(req, res) {
    try {
      const { id } = req.params;
      const agent = await Agent.findOne({ userId: req.user.userId });
      if (!agent) return res.status(404).json({ message: '坐席信息不存在' });

      if (agent.currentChats.length >= agent.maxConcurrent) {
        return res.status(400).json({ message: '已达到最大同时接待数' });
      }

      const conversation = await Conversation.findById(id);
      if (!conversation) return res.status(404).json({ message: '对话不存在' });
      if (conversation.agentId) return res.status(400).json({ message: '该对话已被其他坐席接管' });

      conversation.agentId = req.user.userId;
      await conversation.save();

      agent.currentChats.push({ conversationId: id, acceptedAt: new Date() });
      agent.status = agent.currentChats.length >= agent.maxConcurrent ? 'busy' : 'online';
      await agent.save();

      res.json({ message: '已接管对话', conversation: { id: conversation._id, title: conversation.title } });
    } catch (error) {
      res.status(500).json({ message: '接管失败' });
    }
  }

  async resolveChat(req, res) {
    try {
      const { id } = req.params;
      const agent = await Agent.findOne({ userId: req.user.userId });
      if (!agent) return res.status(404).json({ message: '坐席信息不存在' });

      const conversation = await Conversation.findById(id);
      if (!conversation) return res.status(404).json({ message: '对话不存在' });

      conversation.status = 'archived';
      await conversation.save();

      agent.currentChats = agent.currentChats.filter(c => c.conversationId.toString() !== id);
      agent.totalHandled += 1;
      if (agent.currentChats.length === 0 && agent.status === 'busy') {
        agent.status = 'online';
      }
      await agent.save();

      res.json({ message: '对话已关闭' });
    } catch (error) {
      res.status(500).json({ message: '关闭对话失败' });
    }
  }

  async agentMessage(req, res) {
    try {
      const { id } = req.params;
      const { content } = req.body;
      const conversation = await Conversation.findById(id);
      if (!conversation) return res.status(404).json({ message: '对话不存在' });
      if (conversation.agentId?.toString() !== req.user.userId) {
        return res.status(403).json({ message: '您未接管此对话' });
      }

      conversation.addMessage('agent', content);
      conversation.metadata.lastActive = new Date();
      await conversation.save();

      res.json({ message: '消息发送成功', conversation: { id: conversation._id, messages: conversation.messages } });
    } catch (error) {
      res.status(500).json({ message: '发送消息失败' });
    }
  }
}

module.exports = new AgentController();
