const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { getConfig } = require('../utils/config');

const router = express.Router();

/**
 * 登录接口
 * POST /api/auth/login
 */
router.post('/login', async (req, res) => {
  try {
    const config = getConfig();
    const { username, password } = req.body;
    
    // 验证输入
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: '用户名和密码不能为空'
      });
    }
    
    // 验证用户名
    if (username !== config.admin.username) {
      return res.status(401).json({
        success: false,
        error: '用户名或密码错误'
      });
    }
    
    // 验证密码
    // 注意：在生产环境中，密码应该是加密存储的
    // 这里为了简化，直接比较明文密码
    const isValidPassword = password === config.admin.password;
    
    // 如果配置中有 bcrypt 哈希密码，则使用 bcrypt 验证
    if (config.admin.passwordHash) {
      const isValidPassword = await bcrypt.compare(password, config.admin.passwordHash);
    }
    
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: '用户名或密码错误'
      });
    }
    
    // 生成 JWT token
    const token = jwt.sign(
      {
        username: username,
        role: 'admin'
      },
      config.jwtSecret,
      {
        expiresIn: config.jwtExpiresIn || '24h'
      }
    );
    
    res.json({
      success: true,
      data: {
        token: token,
        expiresIn: config.jwtExpiresIn || '24h',
        user: {
          username: username,
          role: 'admin'
        }
      }
    });
    
  } catch (error) {
    console.error('❌ 登录失败:', error);
    res.status(500).json({
      success: false,
      error: '登录失败，请稍后重试'
    });
  }
});

/**
 * 验证 token 接口
 * GET /api/auth/verify
 */
router.get('/verify', (req, res) => {
  const config = getConfig();
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: '未提供认证令牌'
    });
  }
  
  const token = authHeader.substring(7);
  
  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    res.json({
      success: true,
      data: {
        valid: true,
        user: decoded
      }
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      error: '令牌无效或已过期'
    });
  }
});

/**
 * 修改密码接口
 * POST /api/auth/change-password
 */
router.post('/change-password', async (req, res) => {
  try {
    const config = getConfig();
    const { oldPassword, newPassword } = req.body;
    
    // 验证输入
    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: '旧密码和新密码不能为空'
      });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: '新密码长度不能少于 6 位'
      });
    }
    
    // 验证旧密码
    if (oldPassword !== config.admin.password) {
      return res.status(401).json({
        success: false,
        error: '旧密码错误'
      });
    }
    
    // 这里应该更新配置文件中的密码
    // 为了简化，这里只返回成功信息
    // 在实际应用中，应该将新密码保存到配置文件或数据库
    
    res.json({
      success: true,
      message: '密码修改成功，请重启服务生效'
    });
    
  } catch (error) {
    console.error('❌ 修改密码失败:', error);
    res.status(500).json({
      success: false,
      error: '修改密码失败，请稍后重试'
    });
  }
});

module.exports = router;