const fs = require('fs');
const path = require('path');

let config = null;

/**
 * 加载配置文件
 */
function loadConfig() {
  const configPath = path.join(__dirname, '../../config.json');
  
  try {
    // 尝试读取外部配置文件
    if (fs.existsSync(configPath)) {
      const configFile = fs.readFileSync(configPath, 'utf-8');
      config = JSON.parse(configFile);
    } else {
      // 使用默认配置
      config = getDefaultConfig();
      console.warn('⚠️  配置文件不存在，使用默认配置');
    }
  } catch (error) {
    console.error('❌ 配置文件读取失败:', error.message);
    config = getDefaultConfig();
  }
  
  // 验证必要的配置项
  validateConfig();
  
  return config;
}

/**
 * 获取默认配置
 */
function getDefaultConfig() {
  return {
    port: 3000,
    notesDir: './notes',
    jwtSecret: 'default-secret-key-please-change',
    jwtExpiresIn: '24h',
    admin: {
      username: 'admin',
      password: 'admin123'
    },
    server: {
      host: '0.0.0.0',
      staticDir: './client/dist'
    },
    media: {
      strategy: 'relative',
      globalPath: './.media'
    }
  };
}

/**
 * 验证配置
 */
function validateConfig() {
  if (!config.port || config.port < 1 || config.port > 65535) {
    console.warn('⚠️  无效的端口号，使用默认端口 3000');
    config.port = 3000;
  }
  
  if (!config.jwtSecret || config.jwtSecret.length < 10) {
    console.warn('⚠️  JWT 密钥太短，建议使用至少 32 字符的密钥');
  }
  
  if (!config.admin || !config.admin.username || !config.admin.password) {
    console.warn('⚠️  管理员账号配置缺失，使用默认账号');
    config.admin = {
      username: 'admin',
      password: 'admin123'
    };
  }
  
  // 确保笔记目录是绝对路径
  if (!path.isAbsolute(config.notesDir)) {
    config.notesDir = path.resolve(__dirname, '../../', config.notesDir);
  }
  
  // 确保静态文件目录是绝对路径
  if (config.server && !path.isAbsolute(config.server.staticDir)) {
    config.server.staticDir = path.resolve(__dirname, '../../', config.server.staticDir);
  }
  
  // 验证并默认化 media 配置
  if (!config.media) {
    config.media = {
      strategy: 'relative',
      globalPath: './.media'
    };
    console.warn('⚠️  media 配置缺失，使用默认配置');
  }
  
  // 确保 globalPath 是绝对路径
  if (!path.isAbsolute(config.media.globalPath)) {
    config.media.globalPath = path.resolve(__dirname, '../../', config.media.globalPath);
  }
}

/**
 * 获取配置
 */
function getConfig() {
  if (!config) {
    loadConfig();
  }
  return config;
}

module.exports = {
  loadConfig,
  getConfig
};