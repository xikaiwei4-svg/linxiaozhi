const mongoose = require('mongoose');

const systemPromptSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, enum: ['forestry', 'sales', 'support', 'tech', 'general', 'custom'], default: 'forestry' },
  content: { type: String, required: true },
  isActive: { type: Boolean, default: false },
  isDefault: { type: Boolean, default: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  description: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

systemPromptSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('SystemPrompt', systemPromptSchema);
