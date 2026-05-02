const mongoose = require('mongoose');

const knowledgeDocSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  category: { type: String, enum: ['forestry', 'product', 'faq', 'policy', 'manual', 'other'], default: 'forestry' },
  fileName: String,
  fileType: String,
  fileSize: Number,
  chunks: [{
    index: Number,
    text: String,
    keywords: [String],
    tokenCount: Number
  }],
  metadata: {
    wordCount: Number,
    chunkCount: Number,
    language: { type: String, default: 'zh-CN' }
  },
  status: { type: String, enum: ['processing', 'ready', 'error'], default: 'processing' },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

knowledgeDocSchema.index({ title: 'text', content: 'text' });
knowledgeDocSchema.index({ category: 1 });

module.exports = mongoose.model('KnowledgeDoc', knowledgeDocSchema);
