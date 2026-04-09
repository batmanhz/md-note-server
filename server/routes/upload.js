const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authMiddleware } = require('../middleware/auth');
const { getConfig } = require('../utils/config');

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

// 上传接口需要认证
router.use(authMiddleware);

/**
 * 图片上传
 * POST /api/upload
 * Body: { file: FormData file, filePath: string (当前编辑文件的路径) }
 */
router.post('/', upload.single('file'), (req, res) => {
  try {
    const config = getConfig();
    const { filePath } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        error: '没有上传文件'
      });
    }

    if (!filePath) {
      return res.status(400).json({
        success: false,
        error: '文件路径不能为空'
      });
    }

    // 验证文件路径是否在笔记目录内
    const notesDir = path.resolve(config.notesDir);
    const targetPath = path.resolve(notesDir, filePath);
    
    if (!targetPath.startsWith(notesDir)) {
      return res.status(403).json({
        success: false,
        error: '非法路径访问'
      });
    }

    // 获取当前文件的目录
    const currentDir = path.dirname(targetPath);
    
    // 生成唯一文件名
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext);
    const timestamp = Date.now();
    const uniqueFileName = `${baseName}-${timestamp}${ext}`;
    
    // 根据 media 配置确定存储路径
    const mediaConfig = config.media || { strategy: 'relative', globalPath: './.media' };
    const strategy = mediaConfig.strategy || 'relative';
    
    let assetsDir, relativePath;
    
    if (strategy === 'global') {
      // 全局存储模式
      assetsDir = mediaConfig.globalPath || './.media';
      
      // 创建全局媒体目录（如果不存在）
      if (!fs.existsSync(assetsDir)) {
        fs.mkdirSync(assetsDir, { recursive: true });
      }
      
      const targetFilePath = path.join(assetsDir, uniqueFileName);
      
      // 移动文件到目标位置
      fs.renameSync(file.path, targetFilePath);
      
      // 计算相对路径（相对于笔记目录）
      // 注意：全局存储时，路径是相对于笔记目录的路径
      relativePath = path.relative(notesDir, assetsDir) + '/' + uniqueFileName;
    } else {
      // 相对存储模式（默认行为）
      assetsDir = path.join(currentDir, '.assets');
      
      // 创建 .assets 文件夹（如果不存在）
      if (!fs.existsSync(assetsDir)) {
        fs.mkdirSync(assetsDir, { recursive: true });
      }
      
      const targetFilePath = path.join(assetsDir, uniqueFileName);
      
      // 移动文件到目标位置
      fs.renameSync(file.path, targetFilePath);
      
      // 计算相对路径（相对于笔记目录）
      relativePath = path.join(
        path.relative(notesDir, currentDir),
        '.assets',
        uniqueFileName
      );
    }

    // Vditor 要求的返回格式
    res.json({
      success: true,
      data: {
        errFiles: [],
        succMap: {
          [file.originalname]: relativePath
        }
      }
    });
  } catch (error) {
    console.error('❌ 上传文件失败:', error);
    
    // 清理临时文件
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      success: false,
      error: '上传文件失败'
    });
  }
});

module.exports = router;
