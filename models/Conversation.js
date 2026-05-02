const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, trim: true, maxlength: 200 },
  status: { type: String, enum: ['active', 'archived', 'deleted'], default: 'active' },
  agentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  systemPromptId: { type: mongoose.Schema.Types.ObjectId, ref: 'SystemPrompt', default: null },
  sourceDocs: [{ docId: String, title: String, snippet: String }],
  metadata: {
    model: { type: String, default: 'deepseek-chat' },
    tokensUsed: { type: Number, default: 0 },
    lastActive: { type: Date, default: Date.now },
    rating: { type: Number, min: 1, max: 5 }
  },
  messages: [{
    role: { type: String, enum: ['user', 'assistant', 'system', 'agent'], required: true },
    content: { type: String, required: true },
    metadata: {
      timestamp: { type: Date, default: Date.now },
      tokenCount: { type: Number, default: 0 }
    }
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

conversationSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

conversationSchema.methods.addMessage = function(role, content) {
  this.messages.push({ role, content, metadata: { timestamp: new Date() } });
};

module.exports = mongoose.model('Conversation', conversationSchema);
