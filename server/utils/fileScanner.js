const fs = require('fs');
const path = require('path');

/**
 * 递归扫描目录，获取所有 .md 文件
 * @param {string} dir - 要扫描的目录
 * @param {string} basePath - 基础路径（用于计算相对路径）
 * @returns {Array} 文件列表
 */
function scanDirectory(dir, basePath = dir) {
  const result = [];
  
  try {
    // 确保目录存在
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      return result;
    }
    
    const items = fs.readdirSync(dir, { withFileTypes: true });
    
    // 排序：文件夹在前，然后按名称排序
    items.sort((a, b) => {
      if (a.isDirectory() && !b.isDirectory()) return -1;
      if (!a.isDirectory() && b.isDirectory()) return 1;
      return a.name.localeCompare(b.name);
    });
    
    for (const item of items) {
      const fullPath = path.join(dir, item.name);
      const relativePath = path.relative(basePath, fullPath);
      
      if (item.isDirectory()) {
        // 递归扫描子目录
        const children = scanDirectory(fullPath, basePath);
        result.push({
          name: item.name,
          type: 'folder',
          path: relativePath,
          children: children
        });
      } else if (item.isFile() && item.name.endsWith('.md')) {
        // 添加 .md 文件
        const stats = fs.statSync(fullPath);
        result.push({
          name: item.name,
          type: 'file',
          path: relativePath,
          size: stats.size,
          modifiedTime: stats.mtime,
          createdTime: stats.birthtime
        });
      }
    }
  } catch (error) {
    console.error('❌ 扫描目录失败:', error.message);
  }
  
  return result;
}

/**
 * 读取文件内容
 * @param {string} filePath - 文件路径
 * @param {string} notesDir - 笔记根目录
 * @returns {object} 文件内容
 */
function readFile(filePath, notesDir) {
  const fullPath = path.resolve(notesDir, filePath);
  
  // 安全检查：防止路径遍历攻击
  if (!fullPath.startsWith(notesDir)) {
    throw new Error('非法路径访问');
  }
  
  if (!fs.existsSync(fullPath)) {
    throw new Error('文件不存在');
  }
  
  const stats = fs.statSync(fullPath);
  const content = fs.readFileSync(fullPath, 'utf-8');
  
  return {
    name: path.basename(fullPath),
    path: filePath,
    content: content,
    size: stats.size,
    modifiedTime: stats.mtime,
    createdTime: stats.birthtime
  };
}

/**
 * 保存文件内容
 * @param {string} filePath - 文件路径
 * @param {string} content - 文件内容
 * @param {string} notesDir - 笔记根目录
 * @returns {object} 保存结果
 */
function saveFile(filePath, content, notesDir) {
  const fullPath = path.resolve(notesDir, filePath);
  
  // 安全检查：防止路径遍历攻击
  if (!fullPath.startsWith(notesDir)) {
    throw new Error('非法路径访问');
  }
  
  // 确保目录存在
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(fullPath, content, 'utf-8');
  
  const stats = fs.statSync(fullPath);
  return {
    name: path.basename(fullPath),
    path: filePath,
    size: stats.size,
    modifiedTime: stats.mtime
  };
}

/**
 * 创建文件或文件夹
 * @param {string} filePath - 文件/文件夹路径
 * @param {string} type - 类型 (file/folder)
 * @param {string} notesDir - 笔记根目录
 * @returns {object} 创建结果
 */
function createItem(filePath, type, notesDir) {
  const fullPath = path.resolve(notesDir, filePath);
  
  // 安全检查：防止路径遍历攻击
  if (!fullPath.startsWith(notesDir)) {
    throw new Error('非法路径访问');
  }
  
  // 检查是否已存在
  if (fs.existsSync(fullPath)) {
    throw new Error('文件或文件夹已存在');
  }
  
  if (type === 'folder') {
    fs.mkdirSync(fullPath, { recursive: true });
    return {
      name: path.basename(fullPath),
      type: 'folder',
      path: filePath
    };
  } else {
    // 确保父目录存在
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(fullPath, '', 'utf-8');
    const stats = fs.statSync(fullPath);
    return {
      name: path.basename(fullPath),
      type: 'file',
      path: filePath,
      size: 0,
      modifiedTime: stats.mtime,
      createdTime: stats.birthtime
    };
  }
}

/**
 * 删除文件或文件夹
 * @param {string} filePath - 文件/文件夹路径
 * @param {string} notesDir - 笔记根目录
 * @returns {object} 删除结果
 */
function deleteItem(filePath, notesDir) {
  const fullPath = path.resolve(notesDir, filePath);
  
  // 安全检查：防止路径遍历攻击
  if (!fullPath.startsWith(notesDir)) {
    throw new Error('非法路径访问');
  }
  
  // 禁止删除根目录
  if (fullPath === notesDir) {
    throw new Error('不能删除根目录');
  }
  
  if (!fs.existsSync(fullPath)) {
    throw new Error('文件或文件夹不存在');
  }
  
  const stats = fs.statSync(fullPath);
  const name = path.basename(fullPath);
  const type = stats.isDirectory() ? 'folder' : 'file';
  
  if (stats.isDirectory()) {
    fs.rmSync(fullPath, { recursive: true });
  } else {
    fs.unlinkSync(fullPath);
  }
  
  return {
    name: name,
    type: type,
    path: filePath
  };
}

/**
 * 重命名文件或文件夹
 * @param {string} oldPath - 旧路径
 * @param {string} newPath - 新路径
 * @param {string} notesDir - 笔记根目录
 * @returns {object} 重命名结果
 */
function renameItem(oldPath, newPath, notesDir) {
  const fullOldPath = path.resolve(notesDir, oldPath);
  const fullNewPath = path.resolve(notesDir, newPath);
  
  // 安全检查：防止路径遍历攻击
  if (!fullOldPath.startsWith(notesDir) || !fullNewPath.startsWith(notesDir)) {
    throw new Error('非法路径访问');
  }
  
  if (!fs.existsSync(fullOldPath)) {
    throw new Error('文件或文件夹不存在');
  }
  
  if (fs.existsSync(fullNewPath)) {
    throw new Error('目标路径已存在');
  }
  
  fs.renameSync(fullOldPath, fullNewPath);
  
  const stats = fs.statSync(fullNewPath);
  return {
    name: path.basename(fullNewPath),
    type: stats.isDirectory() ? 'folder' : 'file',
    oldPath: oldPath,
    newPath: newPath
  };
}

module.exports = {
  scanDirectory,
  readFile,
  saveFile,
  createItem,
  deleteItem,
  renameItem
};