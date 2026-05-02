const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const routes = require('./routes');

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 静态文件服务
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MongoDB 连接
mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('MongoDB连接成功');
    await seedAdmin();
    await seedDefaultPrompts();
  })
  .catch((error) => {
    console.error('MongoDB连接失败:', error);
    process.exit(1);
  });

app.use('/api', routes);

app.get('/', (req, res) => {
  res.json({ message: '林业知识AI助手 API', version: '2.0.0', status: '运行中' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// 全局错误处理
app.use((err, req, res, next) => {
  console.error('全局错误:', err);
  res.status(500).json({ message: err.message || '服务器内部错误' });
});

app.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
});

// 创建默认管理员账号
async function seedAdmin() {
  const User = require('./models/User');
  const admin = await User.findOne({ email: 'admin@forestry.com' });
  if (!admin) {
    await User.create({
      username: 'admin',
      email: 'admin@forestry.com',
      password: 'admin123',
      role: 'admin',
      status: 'active'
    });
    console.log('默认管理员已创建: admin@forestry.com / admin123');
  }
}

// 创建林业知识默认提示词
async function seedDefaultPrompts() {
  const SystemPrompt = require('./models/SystemPrompt');
  const count = await SystemPrompt.countDocuments();
  if (count === 0) {
    const defaults = [
      {
        name: '林业知识助手（通用）',
        category: 'forestry',
        isActive: true,
        isDefault: true,
        description: '适用于各类林业知识咨询的通用提示词',
        content: `你是一位专业的林业知识AI助手，名叫"林小智"。你的职责是帮助用户解答关于林业的各类问题。

## 你的知识范围
- 森林资源管理与保护
- 林木育种与栽培技术
- 森林病虫害防治
- 林业政策法规
- 森林生态系统与生物多样性
- 林业经济与产业发展
- 林业碳汇与气候变化

## 回答要求
1. 使用专业但易懂的语言，避免过于学术化的表达
2. 回答要准确、全面，引用相关知识库内容
3. 如果问题超出你的知识范围，诚实告知并建议用户咨询林业专家
4. 涉及林业政策法规时，提醒用户以最新官方文件为准
5. 保持友好、耐心的服务态度

## 回复格式
- 复杂问题使用分点说明
- 重要信息用**加粗**强调
- 涉及数据时注明来源`
      },
      {
        name: '森林病虫害咨询',
        category: 'forestry',
        isActive: false,
        description: '专注于森林病虫害防治问题的咨询',
        content: `你是一位森林病虫害防治专家AI助手。你精通各类森林病虫害的识别、预防和治理方法。

## 专业领域
- 常见森林病害（松材线虫病、松疱锈病、杨树溃疡病等）
- 常见森林虫害（松毛虫、天牛、小蠹虫等）
- 生物防治技术
- 化学防治安全规范
- 森林检疫法规

当用户描述病虫害症状时，请帮助分析可能的病虫害类型，并提供科学的防治建议。同时提醒用户重大疫情应及时上报当地林业主管部门。`
      },
      {
        name: '林业政策咨询',
        category: 'forestry',
        isActive: false,
        description: '专注于林业政策法规解答',
        content: `你是一位林业政策法规咨询AI助手。你熟悉国家和地方的林业法律法规、政策文件和行业标准。

## 专业范围
- 《中华人民共和国森林法》及相关法规
- 林权制度改革政策
- 退耕还林还草政策
- 天然林保护工程
- 林业补贴与扶持政策
- 林业碳汇交易政策

回答时请注明相关政策文件的名称和文号（如有），并提醒用户政策可能有更新，建议以当地林业部门最新通知为准。`
      }
    ];

    await SystemPrompt.insertMany(defaults);
    console.log(`默认林业知识提示词已创建: ${defaults.length} 个`);
  }
}
