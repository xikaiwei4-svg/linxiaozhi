# 🌲 林叶AI智能客服系统

基于人工智能的智能客服系统，支持多轮对话、知识库管理和智能问答。

## 📖 项目简介

林叶AI是一个现代化的智能客服系统，集成了先进的AI技术，为企业提供智能化的客户支持服务。系统支持私有化部署，可以灵活对接各类业务系统。

## ✨ 核心特性

### 🤖 智能对话
- 基于大语言模型的智能对话系统
- 支持多轮上下文对话
- 自动意图识别和情感分析
- 流畅自然的对话体验

### 📚 知识库管理
- 文档上传和管理
- 智能向量检索
- 文档自动分类和标签
- 实时知识更新

### 👥 多角色支持
- 管理员：系统配置和用户管理
- 客服人员：日常工作台
- 知识库管理员：知识维护
- 普通用户：智能问答

### 🔧 系统管理
- 灵活的系统提示词配置
- 对话记录管理和分析
- 用户行为统计
- 权限控制和审计

## 🛠️ 技术栈

### 前端
- **React 18** - 用户界面框架
- **Vite** - 构建工具
- **Ant Design 5** - UI组件库
- **React Router** - 路由管理
- **Axios** - HTTP客户端

### 后端
- **Node.js** - 运行时环境
- **Express** - Web框架
- **MongoDB** - 数据库
- **Mongoose** - ODM框架

### AI服务
- **OpenAI GPT** - 智能对话引擎
- **向量数据库** - 知识检索（可选）

## 🚀 快速开始

### 环境要求

- Node.js >= 16.0
- MongoDB >= 5.0
- npm 或 yarn

### 安装步骤

1. **克隆项目**
```bash
git clone https://github.com/xikaiwei4-svg/linyeai.git
cd linyeai
```

2. **安装后端依赖**
```bash
npm install
```

3. **安装前端依赖**
```bash
cd client
npm install
cd ..
```

4. **配置环境变量**
```bash
cp .env.example .env
```

编辑 `.env` 文件，配置以下内容：
```env
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/linyeai
JWT_SECRET=your-secret-key
OPENAI_API_KEY=your-openai-api-key
```

5. **启动服务**

开发环境：
```bash
# 启动后端（终端1）
npm run dev

# 启动前端（终端2）
cd client
npm run dev
```

生产环境：
```bash
npm run build
npm start
```

## 📁 项目结构

```
linyeai/
├── client/                 # 前端应用
│   ├── src/
│   │   ├── components/    # 公共组件
│   │   ├── pages/         # 页面组件
│   │   ├── services/      # API服务
│   │   ├── App.jsx        # 应用入口
│   │   └── main.jsx       # React入口
│   ├── public/            # 静态资源
│   └── vite.config.js     # Vite配置
│
├── controllers/           # 控制器
│   ├── UserController.js
│   ├── ConversationController.js
│   ├── AdminController.js
│   └── ...
│
├── models/               # 数据模型
│   ├── User.js
│   ├── Conversation.js
│   └── ...
│
├── services/             # 业务服务
│   ├── AIService.js       # AI服务
│   └── ...
│
├── routes/               # 路由定义
│   ├── index.js
│   ├── admin.js
│   └── ...
│
├── middleware/           # 中间件
│   ├── auth.js
│   └── ...
│
├── server.js             # 后端入口
└── package.json
```

## 🔐 API文档

### 认证接口

| 接口 | 方法 | 描述 |
|------|------|------|
| `/api/users/register` | POST | 用户注册 |
| `/api/users/login` | POST | 用户登录 |
| `/api/users/profile` | GET | 获取用户信息 |

### 对话接口

| 接口 | 方法 | 描述 |
|------|------|------|
| `/api/conversations` | GET | 获取对话列表 |
| `/api/conversations` | POST | 创建对话 |
| `/api/conversations/:id/messages` | POST | 发送消息 |

### 管理接口

| 接口 | 方法 | 描述 |
|------|------|------|
| `/api/admin/users` | GET | 用户管理 |
| `/api/admin/stats` | GET | 系统统计 |
| `/api/knowledge/*` | * | 知识库管理 |

## 🎨 界面预览

### 用户端
- 登录/注册页面
- 智能对话界面
- 历史对话管理

### 管理端
- 数据统计面板
- 用户管理界面
- 知识库管理
- 系统设置

## 🔧 配置说明

### 系统提示词配置

管理员可以在后台配置AI的系统提示词，定义AI的角色设定和行为规则。

### 知识库配置

支持多种文档格式上传，自动进行向量化和索引，提供智能检索能力。

## 📈 性能优化

- 前端资源懒加载
- API请求缓存
- 数据库索引优化
- 对话上下文压缩

## 🛡️ 安全特性

- JWT身份认证
- 密码加密存储
- SQL注入防护
- XSS攻击防护
- CORS跨域配置

## 🤝 贡献指南

欢迎提交Issue和Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

## 📧 联系方式

- 项目地址：https://github.com/xikaiwei4-svg/linyeai
- 问题反馈：https://github.com/xikaiwei4-svg/linyeai/issues

## 🙏 致谢

- [React](https://reactjs.org/)
- [Ant Design](https://ant.design/)
- [Node.js](https://nodejs.org/)
- [MongoDB](https://www.mongodb.com/)
- [OpenAI](https://openai.com/)

---

⭐ 如果这个项目对你有帮助，请给我们一个Star！
