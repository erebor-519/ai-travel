# AI Travel - 智能旅行规划应用

## 访问地址

**线上地址**: https://footmarks-d0giax6g8a547ce19-1358671790.tcloudbaseapp.com/

## 技术栈

- **前端框架**: Vue 3 + Vite
- **地图服务**: 高德地图 AMap
- **后端服务**: 腾讯云 CloudBase
- **数据库**: 腾讯云 NoSQL 数据库

## 功能特性

- 🗺️ 智能旅行规划 - AI 生成个性化旅行路线
- 📍 地点收藏 - 收藏和探索热门旅行目的地
- 🗓️ 路线可视化 - 在地图上展示完整旅行路线
- 📝 旅行社区 - 分享和发现旅行规划
- 🔍 搜索功能 - 搜索帖子内容
- 📷 图片上传 - 支持在帖子中上传图片

## 云函数

| 函数名 | 功能 | 状态 |
|--------|------|------|
| auth | 用户认证 | 已部署 |
| forum | 论坛帖子管理 | 已部署 |
| travel-plans | 旅行规划管理 | 已部署 |

## 开发指南

### 安装依赖
```bash
npm install
```

### 本地开发
```bash
npm run dev
```

### 构建部署
```bash
npm run build
```

## 腾讯云 CloudBase 资源

- **环境ID**: footmarks-d0giax6g8a547ce19
- **静态托管**: 已配置
- **云函数**: 3个 (auth, forum, travel-plans)
- **数据库**: posts 集合 (论坛帖子), users 集合 (用户信息)

## 控制台管理

- 环境概览: https://tcb.cloud.tencent.com/dev?envId=footmarks-d0giax6g8a547ce19#/overview
- 云函数管理: https://tcb.cloud.tencent.com/dev?envId=footmarks-d0giax6g8a547ce19#/scf
- 静态网站托管: https://tcb.cloud.tencent.com/dev?envId=footmarks-d0giax6g8a547ce19#/static-hosting
- 数据库管理: https://tcb.cloud.tencent.com/dev?envId=footmarks-d0giax6g8a547ce19#/db/doc




kiriharaAK 4.30
