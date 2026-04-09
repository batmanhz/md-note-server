# md-note-server

轻量级 Markdown 笔记服务器 V2.0 (Wiki 增强版)。后端使用 Node.js + Express，前端使用 Vue 3 + Vite + Vditor。

## V2.0 新特性
- ✨ **所见即所得编辑**：升级到 Vditor 编辑器，默认 SV 模式，更直观的编辑体验
- 📤 **图片上传**：新增 `/api/upload` 接口，支持拖拽上传图片
- 🗂️ **自动资产管理**：图片自动保存到当前笔记同级的 `.assets` 文件夹
- ⚡ **自动保存**：1000ms 防抖自动保存，再也不用担心丢失内容
- 🔗 **Wiki Link**：支持 `[[filename]]` 语法，快速创建笔记间的链接

## 功能特点
- 🚀 **快速部署**：支持直接运行或打包为可执行文件。
- 📝 **所见即所得**：基于 Vditor 的专业 Markdown 编辑器，默认 SV 模式。
- 🖼️ **图片上传**：支持拖拽上传图片，自动保存到同级 `.assets` 文件夹。
- 💾 **自动保存**：编辑内容自动保存，无需手动点击保存按钮。
- 🔗 **Wiki 链接**：支持 `[[filename]]` 语法，快速跳转到其他笔记。
- 📱 **响应式**：支持桌面端和移动端，随时记录灵感。
- 📂 **树形管理**：清晰的文件夹层级管理。
- 🔍 **快速搜索**：实时搜索文件名。
- 🔒 **安全可靠**：JWT 认证，路径遍历防护。

## 快速开始

### 开发模式

1. 安装依赖：
```bash
npm install
cd client && npm install
```

2. 启动后端（默认 3000 端口）：
```bash
npm run dev
```

3. 启动前端（Vite 开发服务器，代理到 3000）：
```bash
npm run client:dev
```

### 打包运行

1. 构建前端：
```bash
npm run client:build
```

2. 使用 `pkg` 打包为二进制文件：
```bash
npm run build:mac   # 生成 macOS 可执行文件
# 或
npm run build:linux # 生成 Linux 可执行文件
```

3. 运行生成的文件：
```bash
./dist/md-note-server-mac
```

## 配置

### 首次使用

1. 复制示例配置文件：
```bash
cp config.example.json config.json
```

2. 修改 `config.json` 中的敏感信息：
   - `jwtSecret`：修改为随机字符串
   - `admin.password`：修改为你的密码

### 配置项说明

| 配置项 | 说明 | 默认值 |
|--------|------|--------|
| `port` | 服务监听端口 | `3000` |
| `notesDir` | 笔记存储目录 | `./notes` |
| `jwtSecret` | JWT 密钥（请修改！） | - |
| `jwtExpiresIn` | Token 过期时间 | `24h` |
| `admin.username` | 管理员用户名 | `admin` |
| `admin.password` | 管理员密码（请修改！） | - |
| `server.host` | 监听地址 | `0.0.0.0` |
| `media.strategy` | 图片存储策略：`relative`（相对）或 `global`（全局） | `relative` |
| `media.globalPath` | 全局存储路径（仅当 strategy 为 `global` 时生效） | `./.media` |

### 配置示例 (config.example.json)

```json
{
  "port": 3000,
  "notesDir": "./notes",
  "jwtSecret": "your-secret-key-change-in-production",
  "jwtExpiresIn": "24h",
  "admin": {
    "username": "admin",
    "password": "your-password"
  },
  "server": {
    "host": "0.0.0.0",
    "staticDir": "./client/dist"
  },
  "media": {
    "strategy": "relative",
    "globalPath": "./.media"
  }
}
```

### 图片存储说明

系统支持两种图片存储策略：

- **relative（相对存储，默认）**：图片保存在当前笔记同级的 `.assets` 文件夹中，方便笔记迁移。
- **global（全局存储）**：所有图片统一保存在 `globalPath` 指定的目录中，适合需要集中管理图片的场景。

例如，将 `media.strategy` 设置为 `"global"`，所有图片将统一保存到 `./.media` 目录。

> ⚠️ **安全提示**：`config.json` 包含敏感信息，已添加到 `.gitignore`，不会被上传到 Git 仓库。
