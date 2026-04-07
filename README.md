# md-note-server

轻量级 Markdown 笔记服务器。后端使用 Node.js + Express，前端使用 Vue 3 + Vite + CodeMirror 6。

## 功能特点
- 🚀 **快速部署**：支持直接运行或打包为可执行文件。
- 📝 **专注编辑**：基于 CodeMirror 6 的专业 Markdown 编辑体验。
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
  }
}
```

> ⚠️ **安全提示**：`config.json` 包含敏感信息，已添加到 `.gitignore`，不会被上传到 Git 仓库。
