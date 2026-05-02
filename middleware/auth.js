const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: '未提供认证令牌' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      return res.status(401).json({ message: '用户不存在' });
    }
    if (user.status === 'disabled') {
      return res.status(403).json({ message: '账号已被禁用' });
    }

    req.user = { userId: decoded.userId, role: user.role };
    next();
  } catch (error) {
    console.error('认证错误:', error);
    return res.status(401).json({ message: '无效的认证令牌' });
  }
};

module.exports = authMiddleware;
