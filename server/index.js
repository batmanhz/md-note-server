const express = require('express');
const path = require('path');
const cors = require('cors');
const { loadConfig, getConfig } = require('./utils/config');

// 加载配置
const config = loadConfig();

// 创建 Express 应用
const app = express();

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 请求日志
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

// API 路由
app.use('/api/auth', require('./routes/auth'));
app.use('/api/files', require('./routes/files'));
app.use('/api/upload', require('./routes/upload'));

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      timestamp: new Date().toISOString()
    }
  });
});

// 静态文件服务（前端）
const staticDir = config.server?.staticDir || path.join(__dirname, '../client/dist');
if (require('fs').existsSync(staticDir)) {
  app.use(express.static(staticDir));
  
  // SPA 回退：所有非 API 路由返回 index.html
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) {
      return next();
    }
    res.sendFile(path.join(staticDir, 'index.html'), (err) => {
      if (err) {
        res.status(404).send('前端资源未找到，请先构建前端项目');
      }
    });
  });
} else {
  console.warn('⚠️  前端静态文件目录不存在:', staticDir);
  console.warn('   请运行: cd client && npm install && npm run build');
}

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('❌ 服务器错误:', err);
  res.status(500).json({
    success: false,
    error: '服务器内部错误'
  });
});

// 404 处理
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: '接口不存在'
  });
});

// 启动服务器
const PORT = config.port || 3000;
const HOST = config.server?.host || '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log('🚀 md-note-server 已启动');
  console.log(`📍 服务地址: http://localhost:${PORT}`);
  console.log(`📁 笔记目录: ${config.notesDir}`);
  console.log(`👤 管理员账号: ${config.admin.username}`);
  console.log(`🔑 JWT 密钥: ${config.jwtSecret.substring(0, 10)}...`);
  console.log('\n按 Ctrl+C 停止服务\n');
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('\n收到 SIGTERM 信号，正在关闭服务...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n收到 SIGINT 信号，正在关闭服务...');
  process.exit(0);
});