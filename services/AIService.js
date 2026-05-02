const { OpenAI } = require('openai');

class AIService {
  constructor() {
    const apiKey = process.env.OPENAI_API_KEY || '';
    const baseURL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';
    this.model = process.env.OPENAI_MODEL || 'deepseek-chat';

    if (apiKey && apiKey.length > 10) {
      this.openai = new OpenAI({ apiKey, baseURL });
      this.ready = true;
    } else {
      this.ready = false;
    }

    this._activePromptCache = null;
    this._promptCacheTime = 0;
  }

  async _getActivePrompt() {
    const now = Date.now();
    if (this._activePromptCache && now - this._promptCacheTime < 30000) {
      return this._activePromptCache;
    }
    try {
      const SystemPrompt = require('../models/SystemPrompt');
      const prompt = await SystemPrompt.findOne({ isActive: true });
      if (prompt) {
        this._activePromptCache = prompt.content;
        this._promptCacheTime = now;
        return prompt.content;
      }
    } catch (e) {
      // model not yet created, use default
    }
    this._activePromptCache = '你是一个专业的林业知识AI助手，请用友好、专业的态度回答用户关于林业的问题。';
    this._promptCacheTime = now;
    return this._activePromptCache;
  }

  async _getKnowledgeContext(messages) {
    try {
      const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
      if (!lastUserMsg) return '';
      const VectorService = require('./VectorService');
      const docs = await VectorService.search(lastUserMsg.content, 3);
      if (docs.length === 0) return '';
      return '\n\n【相关知识库内容】\n' + docs.map((d, i) =>
        `文档《${d.title}》：${d.text.substring(0, 500)}`
      ).join('\n---\n');
    } catch (e) {
      return '';
    }
  }

  async chat(messages, options = {}) {
    if (!this.ready) {
      return {
        content: 'AI服务未配置API Key，请联系管理员。',
        usage: { total_tokens: 0 },
      };
    }

    try {
      const systemPrompt = options.systemPrompt || await this._getActivePrompt();
      let knowledgeContext = '';
      if (options.useKnowledge !== false) {
        knowledgeContext = await this._getKnowledgeContext(messages);
      }

      const fullSystemPrompt = systemPrompt + knowledgeContext;
      const apiMessages = [
        { role: 'system', content: fullSystemPrompt },
        ...messages,
      ];

      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: apiMessages,
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 2000,
      });

      return {
        content: response.choices[0].message.content,
        usage: response.usage,
      };
    } catch (error) {
      console.error('AI服务错误:', error);
      throw new Error(`AI服务错误: ${error.message}`);
    }
  }

  async streamChat(messages, res, options = {}) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    if (!this.ready) {
      const fallback = 'AI服务未配置API Key。请设置有效的API Key后重试。';
      for (const char of fallback) {
        res.write(`data: ${JSON.stringify({ type: 'chunk', content: char })}\n\n`);
        await new Promise(r => setTimeout(r, 30));
      }
      res.write(`data: ${JSON.stringify({ type: 'done', usage: { total_tokens: 0 } })}\n\n`);
      res.end();
      return;
    }

    try {
      const systemPrompt = options.systemPrompt || await this._getActivePrompt();
      let knowledgeContext = '';
      if (options.useKnowledge !== false) {
        knowledgeContext = await this._getKnowledgeContext(messages);
      }

      const apiMessages = [
        { role: 'system', content: systemPrompt + knowledgeContext },
        ...messages,
      ];

      const stream = await this.openai.chat.completions.create({
        model: this.model,
        messages: apiMessages,
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 2000,
        stream: true,
      });

      let totalTokens = 0;

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          totalTokens += 1;
          res.write(`data: ${JSON.stringify({ type: 'chunk', content })}\n\n`);
        }
      }

      res.write(`data: ${JSON.stringify({ type: 'done', usage: { total_tokens: totalTokens } })}\n\n`);
      res.end();
    } catch (error) {
      console.error('AI流式服务错误:', error);
      const errMsg = `AI服务错误: ${error.message}`;
      res.write(`data: ${JSON.stringify({ type: 'error', content: errMsg })}\n\n`);
      res.end();
    }
  }

  async generateTitle(firstMessage) {
    if (!this.ready) return '新对话';

    try {
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: '根据用户的第一条消息，生成一个简短的对话标题，不超过20个字符。只返回标题，不要其他内容。' },
          { role: 'user', content: firstMessage },
        ],
        temperature: 0.5,
        max_tokens: 50,
      });
      return response.choices[0].message.content.trim() || '新对话';
    } catch (error) {
      console.error('生成标题错误:', error);
      return '新对话';
    }
  }

  formatMessages(conversation) {
    return conversation.messages.map(msg => ({
      role: msg.role,
      content: msg.content,
    }));
  }
}

module.exports = new AIService();
