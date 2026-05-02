const User = require('../models/User');
const jwt = require('jsonwebtoken');

class UserController {
  async register(req, res) {
    try {
      const { username, email, password } = req.body;

      if (!username || !email || !password) {
        return res.status(400).json({ message: '请填写所有必填字段' });
      }

      const existingUser = await User.findOne({ 
        $or: [{ username }, { email }] 
      });

      if (existingUser) {
        return res.status(400).json({ message: '用户名或邮箱已存在' });
      }

      const user = new User({ username, email, password });
      await user.save();

      const token = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      res.status(201).json({
        message: '注册成功',
        token,
        user: { id: user._id, username: user.username, email: user.email, role: user.role }
      });
    } catch (error) {
      console.error('注册错误:', error);
      res.status(500).json({ message: '服务器内部错误' });
    }
  }

  async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: '请填写邮箱和密码' });
      }

      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({ message: '邮箱或密码错误' });
      }

      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: '邮箱或密码错误' });
      }

      const token = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      res.json({
        message: '登录成功',
        token,
        user: { id: user._id, username: user.username, email: user.email, role: user.role }
      });
    } catch (error) {
      console.error('登录错误:', error);
      res.status(500).json({ message: '服务器内部错误' });
    }
  }

  async getProfile(req, res) {
    try {
      const user = await User.findById(req.user.userId);
      if (!user) {
        return res.status(404).json({ message: '用户不存在' });
      }

      res.json({
        user: { id: user._id, username: user.username, email: user.email, role: user.role, avatar: user.avatar, preferences: user.preferences }
      });
    } catch (error) {
      console.error('获取用户信息错误:', error);
      res.status(500).json({ message: '服务器内部错误' });
    }
  }

  async updateProfile(req, res) {
    try {
      const { username, avatar, preferences } = req.body;
      const user = await User.findById(req.user.userId);

      if (!user) {
        return res.status(404).json({ message: '用户不存在' });
      }

      if (username && username !== user.username) {
        const existingUser = await User.findOne({ username });
        if (existingUser) {
          return res.status(400).json({ message: '用户名已存在' });
        }
        user.username = username;
      }

      if (avatar) user.avatar = avatar;
      if (preferences) user.preferences = { ...user.preferences, ...preferences };

      await user.save();

      res.json({
        message: '个人信息更新成功',
        user: { id: user._id, username: user.username, email: user.email, role: user.role, avatar: user.avatar, preferences: user.preferences }
      });
    } catch (error) {
      console.error('更新用户信息错误:', error);
      res.status(500).json({ message: '服务器内部错误' });
    }
  }
}

module.exports = new UserController();
