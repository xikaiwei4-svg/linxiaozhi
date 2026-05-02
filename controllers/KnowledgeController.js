const KnowledgeDoc = require('../models/KnowledgeDoc');
const VectorService = require('../services/VectorService');
const upload = require('../middleware/upload');
const fs = require('fs');
const path = require('path');

class KnowledgeController {
  async list(req, res) {
    try {
      const { page = 1, pageSize = 20, category } = req.query;
      const filter = {};
      if (category) filter.category = category;
      const total = await KnowledgeDoc.countDocuments(filter);
      const docs = await KnowledgeDoc.find(filter)
        .select('-content -chunks')
        .sort({ createdAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(parseInt(pageSize));
      res.json({ docs, total, page: parseInt(page), pageSize: parseInt(pageSize) });
    } catch (error) {
      res.status(500).json({ message: '获取知识库列表失败' });
    }
  }

  async getOne(req, res) {
    try {
      const doc = await KnowledgeDoc.findById(req.params.id);
      if (!doc) return res.status(404).json({ message: '文档不存在' });
      res.json({ doc });
    } catch (error) {
      res.status(500).json({ message: '获取文档失败' });
    }
  }

  async upload(req, res) {
    try {
      const file = req.file;
      if (!file) return res.status(400).json({ message: '请上传文件' });

      const ext = path.extname(file.originalname).toLowerCase();
      let text = '';

      if (ext === '.txt' || ext === '.md' || ext === '.html' || ext === '.htm') {
        text = fs.readFileSync(file.path, 'utf-8');
      } else if (ext === '.pdf') {
        try {
          const pdfParse = require('pdf-parse');
          const buffer = fs.readFileSync(file.path);
          const data = await pdfParse(buffer);
          text = data.text;
        } catch (e) {
          text = `[PDF解析失败: ${e.message}] 文件: ${file.originalname}`;
        }
      } else if (ext === '.docx' || ext === '.doc') {
        try {
          const mammoth = require('mammoth');
          const result = await mammoth.extractRawText({ path: file.path });
          text = result.value;
        } catch (e) {
          text = `[DOCX解析失败: ${e.message}] 文件: ${file.originalname}`;
        }
      } else {
        text = fs.readFileSync(file.path, 'utf-8');
      }

      if (!text || text.trim().length === 0) {
        return res.status(400).json({ message: '文件内容为空，无法解析' });
      }

      const chunks = VectorService.splitDocument(text, 500);
      const chunked = chunks.map((chunk, i) => ({
        index: i,
        text: chunk,
        keywords: VectorService.extractKeywords(chunk, 10),
        tokenCount: chunk.length
      }));

      const doc = new KnowledgeDoc({
        title: req.body.title || path.basename(file.originalname, ext),
        content: text,
        category: req.body.category || 'forestry',
        fileName: file.originalname,
        fileType: ext,
        fileSize: file.size,
        chunks: chunked,
        metadata: { wordCount: text.length, chunkCount: chunked.length },
        status: 'ready',
        uploadedBy: req.user.userId
      });

      await doc.save();

      // 重建索引
      await VectorService.buildIndex();

      res.status(201).json({
        message: '文档上传成功',
        doc: { id: doc._id, title: doc.title, category: doc.category, chunkCount: chunked.length }
      });
    } catch (error) {
      res.status(500).json({ message: `上传失败: ${error.message}` });
    }
  }

  async delete(req, res) {
    try {
      const doc = await KnowledgeDoc.findByIdAndDelete(req.params.id);
      if (!doc) return res.status(404).json({ message: '文档不存在' });
      await VectorService.buildIndex();
      res.json({ message: '文档删除成功' });
    } catch (error) {
      res.status(500).json({ message: '删除文档失败' });
    }
  }

  async search(req, res) {
    try {
      const { query } = req.body;
      if (!query) return res.status(400).json({ message: '请输入搜索关键词' });
      const results = await VectorService.search(query, 5);
      res.json({ results });
    } catch (error) {
      res.status(500).json({ message: '搜索失败' });
    }
  }

  // MySQL 知识库接口
  async mysqlList(req, res) {
    try {
      const MysqlKBService = require('../services/MysqlKBService');
      const { page, pageSize, category } = req.query;
      const data = await MysqlKBService.getDocuments(category || null, parseInt(page) || 1, parseInt(pageSize) || 20);
      const categories = await MysqlKBService.getCategories();
      res.json({ ...data, categories });
    } catch (error) {
      res.status(500).json({ message: '获取MySQL知识库失败' });
    }
  }

  async mysqlStats(req, res) {
    try {
      const MysqlKBService = require('../services/MysqlKBService');
      const stats = await MysqlKBService.getStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: '获取统计失败' });
    }
  }

  async mysqlGetOne(req, res) {
    try {
      const MysqlKBService = require('../services/MysqlKBService');
      const doc = await MysqlKBService.getDocument(req.params.id);
      if (!doc) return res.status(404).json({ message: '文档不存在' });
      res.json({ doc });
    } catch (error) {
      res.status(500).json({ message: '获取文档失败' });
    }
  }
}

module.exports = new KnowledgeController();
