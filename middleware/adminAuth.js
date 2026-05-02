const authMiddleware = require('./auth');

const adminAuth = async (req, res, next) => {
  await authMiddleware(req, res, () => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: '需要管理员权限' });
    }
    next();
  });
};

module.exports = adminAuth;
