const Conversation = require('../models/Conversation');
const AIService = require('../services/AIService');

class ConversationController {
  async createConversation(req, res) {
    try {
      const { title } = req.body;
      const userId = req.user.userId;

      const conversation = new Conversation({ userId, title: title || '新对话' });
      await conversation.save();

      res.status(201).json({
        message: '对话创建成功',
        conversation: {
          id: conversation._id,
          title: conversation.title,
          createdAt: conversation.createdAt,
          messages: conversation.messages,
        }
      });
    } catch (error) {
      console.error('创建对话错误:', error);
      res.status(500).json({ message: '服务器内部错误' });
    }
  }

  async getConversations(req, res) {
    try {
      const userId = req.user.userId;
      const conversations = await Conversation.find({
        userId,
        status: { $ne: 'deleted' }
      }).sort({ updatedAt: -1 });

      res.json({
        conversations: conversations.map(conv => ({
          id: conv._id,
          title: conv.title,
          status: conv.status,
          lastMessage: conv.messages.length > 0 ? conv.messages[conv.messages.length - 1] : null,
          createdAt: conv.createdAt,
          updatedAt: conv.updatedAt,
        }))
      });
    } catch (error) {
      console.error('获取对话列表错误:', error);
      res.status(500).json({ message: '服务器内部错误' });
    }
  }

  async getConversation(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;

      const conversation = await Conversation.findOne({
        _id: id, userId, status: { $ne: 'deleted' }
      });

      if (!conversation) {
        return res.status(404).json({ message: '对话不存在' });
      }

      res.json({
        conversation: {
          id: conversation._id,
          title: conversation.title,
          status: conversation.status,
          messages: conversation.messages,
          sourceDocs: conversation.sourceDocs,
          createdAt: conversation.createdAt,
          updatedAt: conversation.updatedAt,
        }
      });
    } catch (error) {
      console.error('获取对话错误:', error);
      res.status(500).json({ message: '服务器内部错误' });
    }
  }

  async sendMessage(req, res) {
    try {
      const { id } = req.params;
      const { content, stream } = req.body;
      const userId = req.user.userId;

      if (!content) {
        return res.status(400).json({ message: '消息内容不能为空' });
      }

      const conversation = await Conversation.findOne({
        _id: id, userId, status: { $ne: 'deleted' }
      });

      if (!conversation) {
        return res.status(404).json({ message: '对话不存在' });
      }

      // 保存用户消息
      conversation.addMessage('user', content);

      // 首条消息自动生成标题
      if (conversation.messages.filter(m => m.role === 'user').length === 1) {
        const title = await AIService.generateTitle(content);
        conversation.title = title;
      }

      const messages = AIService.formatMessages(conversation);

      // SSE 流式模式
      if (stream) {
        await conversation.save();

        await AIService.streamChat(messages, res);

        // 流结束后收集完整响应并保存
        // 注意: SSE 流已写入 res，这里需要在流中收集内容
        // 由于 SSE 直接写 res 无法回溯，我们使用临时文件或另一个方式
        // 实际上在后端代理流时，我们依靠前端来管理消息显示
        return;
      }

      // 普通模式
      const aiResponse = await AIService.chat(messages);
      conversation.addMessage('assistant', aiResponse.content);
      conversation.metadata.tokensUsed += (aiResponse.usage?.total_tokens || 0);
      conversation.metadata.lastActive = new Date();
      await conversation.save();

      res.json({
        message: '消息发送成功',
        conversation: {
          id: conversation._id,
          title: conversation.title,
          messages: conversation.messages,
        },
        aiResponse: aiResponse.content,
      });
    } catch (error) {
      console.error('发送消息错误:', error);
      res.status(500).json({ message: error.message || '服务器内部错误' });
    }
  }

  // SSE 流式消息 + 持久化版本（推荐）
  async sendMessageStream(req, res) {
    try {
      const { id } = req.params;
      const { content } = req.body;
      const userId = req.user.userId;

      if (!content) {
        return res.status(400).json({ message: '消息内容不能为空' });
      }

      const conversation = await Conversation.findOne({
        _id: id, userId, status: { $ne: 'deleted' }
      });

      if (!conversation) {
        return res.status(404).json({ message: '对话不存在' });
      }

      conversation.addMessage('user', content);

      if (conversation.messages.filter(m => m.role === 'user').length === 1) {
        const title = await AIService.generateTitle(content);
        conversation.title = title;
      }

      const messages = AIService.formatMessages(conversation);

      // 创建 Promise 包装 SSE 流，收集完整响应
      let fullContent = '';
      const originalWrite = res.write.bind(res);
      const originalEnd = res.end.bind(res);

      res.write = (chunk) => {
        try {
          const line = chunk.toString();
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));
            if (data.type === 'chunk') fullContent += data.content;
          }
        } catch (e) {}
        return originalWrite(chunk);
      };

      res.end = async (chunk) => {
        if (chunk) originalWrite(chunk);
        // 保存 AI 回复到数据库
        if (fullContent) {
          try {
            conversation.addMessage('assistant', fullContent);
            conversation.metadata.lastActive = new Date();
            await conversation.save();
          } catch (e) {
            console.error('保存流式消息失败:', e);
          }
        }
        return originalEnd();
      };

      await AIService.streamChat(messages, res);
    } catch (error) {
      console.error('流式消息错误:', error);
      if (!res.headersSent) {
        res.status(500).json({ message: error.message || '服务器内部错误' });
      }
    }
  }

  async updateConversation(req, res) {
    try {
      const { id } = req.params;
      const { title, status } = req.body;
      const userId = req.user.userId;

      const conversation = await Conversation.findOne({
        _id: id, userId, status: { $ne: 'deleted' }
      });

      if (!conversation) {
        return res.status(404).json({ message: '对话不存在' });
      }

      if (title) conversation.title = title;
      if (status) conversation.status = status;
      await conversation.save();

      res.json({
        message: '对话更新成功',
        conversation: {
          id: conversation._id,
          title: conversation.title,
          status: conversation.status,
          updatedAt: conversation.updatedAt,
        }
      });
    } catch (error) {
      console.error('更新对话错误:', error);
      res.status(500).json({ message: '服务器内部错误' });
    }
  }

  async deleteConversation(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;

      const conversation = await Conversation.findOne({
        _id: id, userId, status: { $ne: 'deleted' }
      });

      if (!conversation) {
        return res.status(404).json({ message: '对话不存在' });
      }

      conversation.status = 'deleted';
      await conversation.save();

      res.json({ message: '对话删除成功' });
    } catch (error) {
      console.error('删除对话错误:', error);
      res.status(500).json({ message: '服务器内部错误' });
    }
  }
}

module.exports = new ConversationController();
