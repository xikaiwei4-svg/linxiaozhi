const mongoose = require('mongoose');

const agentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  skills: [{ type: String, enum: ['forestry', 'sales', 'support', 'tech', 'general'] }],
  status: { type: String, enum: ['online', 'offline', 'busy', 'away'], default: 'offline' },
  maxConcurrent: { type: Number, default: 3 },
  currentChats: [{
    conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation' },
    acceptedAt: Date
  }],
  totalHandled: { type: Number, default: 0 },
  rating: { type: Number, default: 5.0 },
  lastActiveAt: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

agentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Agent', agentSchema);
