const mysql = require('mysql2/promise');

class MysqlKBService {
  constructor() {
    this.pool = null;
  }

  async getPool() {
    if (this.pool) return this.pool;
    this.pool = mysql.createPool({
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: '123456',
      database: 'forestry_kb',
      charset: 'utf8mb4',
      waitForConnections: true,
      connectionLimit: 5,
    });
    return this.pool;
  }

  async search(query, limit = 5) {
    try {
      const pool = await this.getPool();

      // 分词：按常见分隔符和单字组合拆分
      const rawWords = query.split(/[\s，。！？；：、"'（）【】《》\n\r]+/).filter(w => w.length >= 1);
      // 为大词生成2-gram子词提高匹配率
      const keywords = [];
      const seen = new Set();
      for (const w of rawWords) {
        if (!seen.has(w) && w.length >= 2) { keywords.push(w); seen.add(w); }
        // 2-gram
        for (let i = 0; i < w.length - 1; i++) {
          const gram = w.substring(i, i + 2);
          if (!seen.has(gram)) { keywords.push(gram); seen.add(gram); }
        }
      }
      if (keywords.length === 0) return [];

      // 构建LIKE条件
      const likeParts = keywords.map(() => '(title LIKE ? OR content LIKE ?)');
      const likeParams = [];
      for (const kw of keywords) {
        likeParams.push(`%${kw}%`, `%${kw}%`);
      }

      const sql = `SELECT id, title, category_id, source, keywords
        FROM documents
        WHERE ${likeParts.join(' OR ')}
        ORDER BY
          (CASE WHEN title LIKE ${pool.escape(`%${rawWords[0]}%`)} THEN 10 ELSE 0 END) +
          (CASE WHEN content LIKE ${pool.escape(`%${rawWords[0]}%`)} THEN 5 ELSE 0 END) DESC
        LIMIT ?`;

      likeParams.push(limit);
      const [docs] = await pool.query(sql, likeParams);

      if (docs.length === 0) return [];

      // 获取匹配文档的分块（每个文档取最相关的分块）
      const docIds = docs.map(d => d.id);
      const chunks = [];
      for (const docId of docIds) {
        const [chunkRows] = await pool.query(
          `SELECT c.*, d.title, d.category_id, d.source
           FROM chunks c
           JOIN documents d ON c.document_id = d.id
           WHERE c.document_id = ?
           ORDER BY
             (CASE WHEN c.content LIKE ? THEN 3 ELSE 0 END) DESC,
             c.chunk_index
           LIMIT 1`,
          [docId, `%${rawWords[0]}%`]
        );
        for (const c of chunkRows) {
          chunks.push(c);
        }
      }

      const results = chunks.slice(0, limit).map(c => ({
        docId: String(c.document_id),
        title: c.title,
        text: c.content.substring(0, 600),
        source: c.source || '林业知识库',
        score: 1.0,
      }));

      return results;
    } catch (error) {
      console.error('MySQL知识库搜索失败:', error.message);
      return [];
    }
  }

  async getCategories() {
    try {
      const pool = await this.getPool();
      const [cats] = await pool.execute(
        'SELECT c.*, COUNT(d.id) as doc_count FROM categories c LEFT JOIN documents d ON c.id = d.category_id GROUP BY c.id'
      );
      return cats;
    } catch (e) {
      return [];
    }
  }

  async getDocuments(categoryId = null, page = 1, pageSize = 20) {
    try {
      const pool = await this.getPool();
      let query = 'SELECT id, title, source, keywords, category_id, created_at FROM documents';
      const params = [];
      if (categoryId) {
        query += ' WHERE category_id = ?';
        params.push(categoryId);
      }
      query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
      params.push(pageSize, (page - 1) * pageSize);

      const [docs] = await pool.execute(query, params);
      const [countResult] = await pool.execute(
        'SELECT COUNT(*) as total FROM documents' + (categoryId ? ' WHERE category_id = ?' : ''),
        categoryId ? [categoryId] : []
      );

      return { docs, total: countResult[0].total, page, pageSize };
    } catch (e) {
      return { docs: [], total: 0, page, pageSize };
    }
  }

  async getDocument(id) {
    try {
      const pool = await this.getPool();
      const [docs] = await pool.execute('SELECT * FROM documents WHERE id = ?', [id]);
      if (docs.length === 0) return null;

      const [chunks] = await pool.execute(
        'SELECT * FROM chunks WHERE document_id = ? ORDER BY chunk_index', [id]
      );
      return { ...docs[0], chunks };
    } catch (e) {
      return null;
    }
  }

  async getStats() {
    try {
      const pool = await this.getPool();
      const [docCount] = await pool.execute('SELECT COUNT(*) as cnt FROM documents');
      const [chunkCount] = await pool.execute('SELECT COUNT(*) as cnt FROM chunks');
      const [catCount] = await pool.execute('SELECT COUNT(*) as cnt FROM categories');
      return {
        documents: docCount[0].cnt,
        chunks: chunkCount[0].cnt,
        categories: catCount[0].cnt,
      };
    } catch (e) {
      return { documents: 0, chunks: 0, categories: 0 };
    }
  }
}

module.exports = new MysqlKBService();
