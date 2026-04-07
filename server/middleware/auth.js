const jwt = require('jsonwebtoken');
const { getConfig } = require('../utils/config');

/**
 * JWT 认证中间件
 */
function authMiddleware(req, res, next) {
  const config = getConfig();
  
  // 从请求头获取 token
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: '未提供认证令牌'
    });
  }
  
  const token = authHeader.substring(7); // 移除 "Bearer " 前缀
  
  try {
    // 验证 token
    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: '令牌已过期，请重新登录'
      });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: '无效的令牌'
      });
    } else {
      return res.status(401).json({
        success: false,
        error: '令牌验证失败'
      });
    }
  }
}

/**
 * 可选的认证中间件（不强制要求）
 */
function optionalAuthMiddleware(req, res, next) {
  const config = getConfig();
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const decoded = jwt.verify(token, config.jwtSecret);
      req.user = decoded;
    } catch (error) {
      // 忽略错误，继续执行
    }
  }
  
  next();
}

module.exports = {
  authMiddleware,
  optionalAuthMiddleware
};