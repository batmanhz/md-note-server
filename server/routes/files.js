const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const { getConfig } = require('../utils/config');
const {
  scanDirectory,
  readFile,
  saveFile,
  createItem,
  deleteItem,
  renameItem
} = require('../utils/fileScanner');

const router = express.Router();

// 所有文件操作都需要认证
router.use(authMiddleware);

/**
 * 获取文件列表
 * GET /api/files
 */
router.get('/', (req, res) => {
  try {
    const config = getConfig();
    const files = scanDirectory(config.notesDir);
    
    res.json({
      success: true,
      data: {
        files: files,
        basePath: config.notesDir
      }
    });
  } catch (error) {
    console.error('❌ 获取文件列表失败:', error);
    res.status(500).json({
      success: false,
      error: '获取文件列表失败'
    });
  }
});

/**
 * 读取文件内容
 * GET /api/files/content
 * Query: path - 文件路径
 */
router.get('/content', (req, res) => {
  try {
    const config = getConfig();
    const filePath = req.query.path;
    
    if (!filePath) {
      return res.status(400).json({
        success: false,
        error: '文件路径不能为空'
      });
    }
    
    const file = readFile(filePath, config.notesDir);
    
    res.json({
      success: true,
      data: file
    });
  } catch (error) {
    console.error('❌ 读取文件失败:', error);
    
    if (error.message === '非法路径访问') {
      return res.status(403).json({
        success: false,
        error: '非法路径访问'
      });
    }
    
    if (error.message === '文件不存在') {
      return res.status(404).json({
        success: false,
        error: '文件不存在'
      });
    }
    
    res.status(500).json({
      success: false,
      error: '读取文件失败'
    });
  }
});

/**
 * 保存文件
 * POST /api/files/save
 * Body: { path: string, content: string }
 */
router.post('/save', (req, res) => {
  try {
    const config = getConfig();
    const { path: filePath, content } = req.body;
    
    if (!filePath) {
      return res.status(400).json({
        success: false,
        error: '文件路径不能为空'
      });
    }
    
    // 确保文件扩展名是 .md
    if (!filePath.endsWith('.md')) {
      return res.status(400).json({
        success: false,
        error: '只能保存 .md 文件'
      });
    }
    
    const file = saveFile(filePath, content || '', config.notesDir);
    
    res.json({
      success: true,
      data: file,
      message: '保存成功'
    });
  } catch (error) {
    console.error('❌ 保存文件失败:', error);
    
    if (error.message === '非法路径访问') {
      return res.status(403).json({
        success: false,
        error: '非法路径访问'
      });
    }
    
    res.status(500).json({
      success: false,
      error: '保存文件失败'
    });
  }
});

/**
 * 创建文件或文件夹
 * POST /api/files/create
 * Body: { path: string, type: 'file' | 'folder' }
 */
router.post('/create', (req, res) => {
  try {
    const config = getConfig();
    const { path: filePath, type } = req.body;
    
    if (!filePath) {
      return res.status(400).json({
        success: false,
        error: '路径不能为空'
      });
    }
    
    if (!type || !['file', 'folder'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: '类型必须是 file 或 folder'
      });
    }
    
    // 文件类型必须是 .md
    if (type === 'file' && !filePath.endsWith('.md')) {
      return res.status(400).json({
        success: false,
        error: '只能创建 .md 文件'
      });
    }
    
    const item = createItem(filePath, type, config.notesDir);
    
    res.json({
      success: true,
      data: item,
      message: '创建成功'
    });
  } catch (error) {
    console.error('❌ 创建失败:', error);
    
    if (error.message === '非法路径访问') {
      return res.status(403).json({
        success: false,
        error: '非法路径访问'
      });
    }
    
    if (error.message === '文件或文件夹已存在') {
      return res.status(409).json({
        success: false,
        error: '文件或文件夹已存在'
      });
    }
    
    res.status(500).json({
      success: false,
      error: '创建失败'
    });
  }
});

/**
 * 删除文件或文件夹
 * DELETE /api/files/delete
 * Body: { path: string }
 */
router.delete('/delete', (req, res) => {
  try {
    const config = getConfig();
    const { path: filePath } = req.body;
    
    if (!filePath) {
      return res.status(400).json({
        success: false,
        error: '路径不能为空'
      });
    }
    
    const item = deleteItem(filePath, config.notesDir);
    
    res.json({
      success: true,
      data: item,
      message: '删除成功'
    });
  } catch (error) {
    console.error('❌ 删除失败:', error);
    
    if (error.message === '非法路径访问') {
      return res.status(403).json({
        success: false,
        error: '非法路径访问'
      });
    }
    
    if (error.message === '不能删除根目录') {
      return res.status(403).json({
        success: false,
        error: '不能删除根目录'
      });
    }
    
    if (error.message === '文件或文件夹不存在') {
      return res.status(404).json({
        success: false,
        error: '文件或文件夹不存在'
      });
    }
    
    res.status(500).json({
      success: false,
      error: '删除失败'
    });
  }
});

/**
 * 重命名文件或文件夹
 * POST /api/files/rename
 * Body: { oldPath: string, newPath: string }
 */
router.post('/rename', (req, res) => {
  try {
    const config = getConfig();
    const { oldPath, newPath } = req.body;
    
    if (!oldPath || !newPath) {
      return res.status(400).json({
        success: false,
        error: '旧路径和新路径不能为空'
      });
    }
    
    const item = renameItem(oldPath, newPath, config.notesDir);
    
    res.json({
      success: true,
      data: item,
      message: '重命名成功'
    });
  } catch (error) {
    console.error('❌ 重命名失败:', error);
    
    if (error.message === '非法路径访问') {
      return res.status(403).json({
        success: false,
        error: '非法路径访问'
      });
    }
    
    if (error.message === '文件或文件夹不存在') {
      return res.status(404).json({
        success: false,
        error: '文件或文件夹不存在'
      });
    }
    
    if (error.message === '目标路径已存在') {
      return res.status(409).json({
        success: false,
        error: '目标路径已存在'
      });
    }
    
    res.status(500).json({
      success: false,
      error: '重命名失败'
    });
  }
});

module.exports = router;