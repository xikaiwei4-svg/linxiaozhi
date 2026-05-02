const SystemPrompt = require('../models/SystemPrompt');

class SystemPromptController {
  async list(req, res) {
    try {
      const prompts = await SystemPrompt.find().sort({ category: 1, name: 1 });
      res.json({ prompts });
    } catch (error) {
      res.status(500).json({ message: '获取提示词列表失败' });
    }
  }

  async getActive(req, res) {
    try {
      const prompt = await SystemPrompt.findOne({ isActive: true });
      res.json({ prompt: prompt || { content: '你是一个专业的林业知识AI助手，请用友好、专业的态度回答用户关于林业的问题。' } });
    } catch (error) {
      res.status(500).json({ message: '获取激活提示词失败' });
    }
  }

  async create(req, res) {
    try {
      const { name, content, category, description } = req.body;
      const prompt = new SystemPrompt({ name, content, category, description, createdBy: req.user.userId });
      await prompt.save();
      res.status(201).json({ message: '提示词创建成功', prompt });
    } catch (error) {
      res.status(500).json({ message: '创建提示词失败' });
    }
  }

  async update(req, res) {
    try {
      const { id } = req.params;
      const { name, content, category, description } = req.body;
      const prompt = await SystemPrompt.findByIdAndUpdate(
        id, { name, content, category, description }, { new: true }
      );
      if (!prompt) return res.status(404).json({ message: '提示词不存在' });
      res.json({ message: '提示词更新成功', prompt });
    } catch (error) {
      res.status(500).json({ message: '更新提示词失败' });
    }
  }

  async delete(req, res) {
    try {
      const { id } = req.params;
      const prompt = await SystemPrompt.findByIdAndDelete(id);
      if (!prompt) return res.status(404).json({ message: '提示词不存在' });
      res.json({ message: '提示词删除成功' });
    } catch (error) {
      res.status(500).json({ message: '删除提示词失败' });
    }
  }

  async activate(req, res) {
    try {
      const { id } = req.params;
      await SystemPrompt.updateMany({}, { isActive: false });
      const prompt = await SystemPrompt.findByIdAndUpdate(id, { isActive: true }, { new: true });
      if (!prompt) return res.status(404).json({ message: '提示词不存在' });
      res.json({ message: '提示词已激活', prompt });
    } catch (error) {
      res.status(500).json({ message: '激活提示词失败' });
    }
  }
}

module.exports = new SystemPromptController();
