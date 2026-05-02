const express = require('express');
const KnowledgeController = require('../controllers/KnowledgeController');
const upload = require('../middleware/upload');

const router = express.Router();

router.get('/', KnowledgeController.list);
router.get('/:id', KnowledgeController.getOne);
router.post('/upload', upload.single('file'), KnowledgeController.upload);
router.delete('/:id', KnowledgeController.delete);
router.post('/search', KnowledgeController.search);

// MySQL 知识库端点
router.get('/mysql/list', KnowledgeController.mysqlList);
router.get('/mysql/stats', KnowledgeController.mysqlStats);
router.get('/mysql/:id', KnowledgeController.mysqlGetOne);

module.exports = router;
