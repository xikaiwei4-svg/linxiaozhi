const User = require('../models/User');
const Conversation = require('../models/Conversation');
const KnowledgeDoc = require('../models/KnowledgeDoc');
const Agent = require('../models/Agent');

class AdminController {
  async dashboard(req, res) {
    try {
      const [totalUsers, totalConversations, totalDocs, onlineAgents] = await Promise.all([
        User.countDocuments(),
        Conversation.countDocuments({ status: { $ne: 'deleted' } }),
        KnowledgeDoc.countDocuments({ status: 'ready' }),
        Agent.countDocuments({ status: 'online' })
      ]);

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayConversations = await Conversation.countDocuments({ createdAt: { $gte: todayStart } });
      const todayMessages = await Conversation.aggregate([
        { $match: { 'messages.metadata.timestamp': { $gte: todayStart } } },
        { $unwind: '$messages' },
        { $match: { 'messages.metadata.timestamp': { $gte: todayStart } } },
        { $count: 'count' }
      ]);

      const weekStats = await Conversation.aggregate([
        { $match: { createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]);

      res.json({
        dashboard: {
          totalUsers,
          totalConversations,
          todayConversations,
          todayMessages: todayMessages[0]?.count || 0,
          totalDocs,
          onlineAgents,
          weekStats
        }
      });
    } catch (error) {
      res.status(500).json({ message: '获取仪表盘数据失败' });
    }
  }

  async listUsers(req, res) {
    try {
      const { page = 1, pageSize = 20 } = req.query;
      const total = await User.countDocuments();
      const users = await User.find().select('-password').sort({ createdAt: -1 })
        .skip((page - 1) * pageSize).limit(parseInt(pageSize));
      res.json({ users, total, page: parseInt(page), pageSize: parseInt(pageSize) });
    } catch (error) {
      res.status(500).json({ message: '获取用户列表失败' });
    }
  }

  async updateUser(req, res) {
    try {
      const { id } = req.params;
      const { role, status } = req.body;
      const user = await User.findByIdAndUpdate(id, { role, status }, { new: true }).select('-password');
      if (!user) return res.status(404).json({ message: '用户不存在' });

      if (role === 'agent') {
        let agent = await Agent.findOne({ userId: id });
        if (!agent) {
          agent = new Agent({ userId: id, skills: ['forestry'] });
          await agent.save();
        }
      }

      res.json({ message: '用户更新成功', user });
    } catch (error) {
      res.status(500).json({ message: '更新用户失败' });
    }
  }

  async listConversations(req, res) {
    try {
      const { page = 1, pageSize = 20 } = req.query;
      const total = await Conversation.countDocuments();
      const conversations = await Conversation.find()
        .populate('userId', 'username email')
        .populate('agentId', 'username')
        .sort({ updatedAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(parseInt(pageSize));
      res.json({ conversations, total, page: parseInt(page), pageSize: parseInt(pageSize) });
    } catch (error) {
      res.status(500).json({ message: '获取对话列表失败' });
    }
  }
}

module.exports = new AdminController();
