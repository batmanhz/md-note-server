# 变更日志 V2.1 - 图片存储位置可配置

## 概述
支持图片存储位置可配置，用户可以选择相对存储（默认）或全局存储模式。

## 变更内容

### 1. 配置文件更新

#### config.json 新增字段
```json
{
  "media": {
    "strategy": "relative",  // 可选 "relative" 或 "global"
    "globalPath": "./.media"  // 全局存储路径
  }
}
```

#### config.example.json 同步更新
- 新增 `media` 配置段

### 2. 后端逻辑调整

#### server/utils/config.js
- `getDefaultConfig()`: 新增默认 `media` 配置
- `validateConfig()`: 新增 `media` 配置验证逻辑，确保 `globalPath` 解析为绝对路径

#### server/routes/upload.js
- 根据 `media.strategy` 判断存储策略：
  - **relative（默认）**: 图片保存到当前笔记同级的 `.assets` 文件夹
  - **global**: 所有图片统一保存到 `media.globalPath` 指定的目录
- 返回的图片 URL 自动适配不同存储策略，确保前端能正确预览

### 3. 文档更新

#### README.md
- 新增 `media` 配置项说明
- 新增图片存储策略说明章节

## 使用说明

### 相对存储模式（默认）
```json
{
  "media": {
    "strategy": "relative"
  }
}
```
图片路径示例：`folder1/note1/.assets/image-1234567890.png`

### 全局存储模式
```json
{
  "media": {
    "strategy": "global",
    "globalPath": "./.media"
  }
}
```
图片路径示例：`../.media/image-1234567890.png`（相对于笔记目录）

## 向后兼容性
- 如果 `media` 配置缺失，系统默认使用相对存储模式
- 现有的相对存储逻辑保持不变，不影响已部署的实例

## 注意事项
- 全局存储路径需要确保有写入权限
- 切换存储策略后，已上传的图片不会自动迁移
