const KnowledgeDoc = require('../models/KnowledgeDoc');

let _indexCache = [];
let _indexTime = 0;

class VectorService {
  extractKeywords(text, limit = 10) {
    if (!text) return [];
    const words = text.split(/[\s，。！？；：、"'（）、\n\r]+/).filter(w => w.length >= 2 && w.length <= 10);
    const freq = {};
    for (const w of words) {
      if (/^[\d]+$/.test(w)) continue;
      freq[w] = (freq[w] || 0) + 1;
    }
    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([k]) => k);
  }

  splitDocument(content, chunkSize = 500) {
    const paragraphs = content.split(/\n{2,}/);
    const chunks = [];
    let currentChunk = '';
    for (const para of paragraphs) {
      const cleaned = para.trim();
      if (!cleaned) continue;
      if ((currentChunk + cleaned).length > chunkSize && currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = cleaned;
      } else {
        currentChunk += (currentChunk ? '\n' : '') + cleaned;
      }
    }
    if (currentChunk.trim()) chunks.push(currentChunk.trim());
    return chunks.length > 0 ? chunks : [content.substring(0, chunkSize)];
  }

  async buildIndex() {
    try {
      const docs = await KnowledgeDoc.find({ status: 'ready' }, { title: 1, chunks: 1 });
      const index = [];
      for (const doc of docs) {
        for (const chunk of doc.chunks) {
          index.push({
            docId: doc._id.toString(),
            title: doc.title,
            text: chunk.text,
            keywords: chunk.keywords || this.extractKeywords(chunk.text, 10)
          });
        }
      }
      _indexCache = index;
      _indexTime = Date.now();
      return index.length;
    } catch (e) {
      console.error('构建索引失败:', e);
      return 0;
    }
  }

  async search(query, limit = 3) {
    if (!query) return [];
    if (_indexCache.length === 0) await this.buildIndex();

    let results = [];

    // 1. MongoDB 索引搜索
    if (_indexCache.length > 0) {
      const queryKeywords = this.extractKeywords(query, 10);
      const scored = _indexCache.map(item => {
        let score = 0;
        const textLower = item.text.toLowerCase();
        const queryLower = query.toLowerCase();
        for (const kw of queryKeywords) {
          if (item.keywords.includes(kw)) score += 3;
          else if (textLower.includes(kw.toLowerCase())) score += 1;
        }
        if (textLower.includes(queryLower)) score += 5;
        for (const kw of queryKeywords) {
          const count = (textLower.match(new RegExp(kw.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
          score += count * 0.5;
        }
        return { ...item, score };
      });
      scored.sort((a, b) => b.score - a.score);
      let seen = new Set();
      for (const item of scored) {
        if (item.score <= 0) continue;
        if (!seen.has(item.docId)) {
          results.push({ docId: item.docId, title: item.title, text: item.text, score: item.score, source: 'mongo' });
          seen.add(item.docId);
        }
      }
    }

    // 2. MySQL 知识库搜索
    try {
      const MysqlKBService = require('./MysqlKBService');
      const mysqlResults = await MysqlKBService.search(query, limit);
      for (const r of mysqlResults) {
        if (!results.find(mr => mr.title === r.title)) {
          results.push({ ...r, source: 'mysql' });
        }
      }
    } catch (e) {
      // MySQL 不可用时静默跳过
    }

    // 去重+按分数排序+限制返回
    const seen = new Set();
    const final = [];
    for (const item of results.sort((a, b) => (b.score || 0) - (a.score || 0))) {
      if (!seen.has(item.docId)) {
        final.push(item);
        seen.add(item.docId);
        if (final.length >= limit) break;
      }
    }
    return final;
  }
}

module.exports = new VectorService();
