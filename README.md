# 🐟 FishGrow（鱼成长 / フィッシュグロウ）

## 📖 项目简介

**FishGrow** 是一款**虚拟养鱼**小游戏 —— 选择鱼种，看着小鱼从鱼苗一步步长到成鱼；按时喂食，根据实时天气获得专属养护建议。

**解决什么问题**：现代都市人养真鱼门槛高、空间贵、时间碎；FishGrow 把「鱼的成长」做成可随时打开的低负担体验，同时通过天气感知提醒把「养护决策」自动化。

技术栈：**Next.js 14 (App Router) + NestJS 11 + Prisma + SQLite**，面向免费额度部署，开箱即用。

---

## ✨ 核心功能（MVP 7 大特性）

| # | 功能 | 说明 |
|---|------|------|
| 1 | 🐠 **鱼种库 + 自定义鱼种** | 内置 10 种默认鱼，支持中/英/日多语言；用户可提交自定义鱼种 |
| 2 | 🫧 **鱼缸 + 鱼只管理** | 鱼缸、鱼只的完整 CRUD；4 个成长阶段：鱼苗 → 幼鱼 → 亚成 → 成鱼 |
| 3 | 🍤 **喂食 + 成长模型** | 一键喂食；成长百分比基于鱼种 `growthDays` 和喂食历史动态计算 |
| 4 | 🌦️ **天气感知** | IP 定位（ipapi.co）+ 实时天气（Open-Meteo）→ 生成每条鱼的喂食建议 |
| 5 | ⏰ **智能提醒** | 根据鱼种喂食频率和鱼缸尺寸自动派生；支持完整 CRUD |
| 6 | 🌐 **多语言 UI** | `next-intl` 集成中/英/日；鱼名从 DB JSONB 字段按语言读取 |
| 7 | 🎨 **清新治愈 UI 风格** | 自然水彩调色板：`#5BA9C7` / `#F4E4C1` / `#FF7F50` |

---

## 🛠️ 技术栈

| 类别 | 选型 |
|------|------|
| **前端** | Next.js 14（App Router）、React 18、Tailwind CSS、next-intl |
| **后端** | NestJS 11、Prisma ORM、SQLite（Prisma 内置驱动） |
| **数据库** | SQLite 3.x（开发/部署同库，Railway 通过 Volume 持久化） |
| **部署** | Vercel（前端，免信用卡）+ Railway（后端，Volume 挂载 SQLite） |
| **测试** | Jest（后端单元/集成测试）+ Next.js 组件测试 |
| **CI** | GitHub Actions（`.github/workflows/ci.yml`：lint + test + build） |

---

## 📋 环境要求

| 项目 | 最低版本 / 要求 | 备注 |
|------|----------------|------|
| **Node.js** | `>= 20.0.0` | 代码使用 `--target ES2023` + `nodenext` 模块系统，需 Node 20+ |
| **npm** | `>= 10` | `package-lock.json` 为 `lockfileVersion 3` |
| **Git** | `>= 2.30` | 支持新版 git 协议与 worktree |
| **磁盘** | `>= 2 GB 可用` | 前后端 `node_modules` 合计约 500 MB+，build 产物约 200 MB |
| **内存** | `>= 2 GB` | 后端约 100 MB；前端 dev 模式约 500 MB |
| **端口** | `3000`（后端）+ `3001`（前端）必须空闲 | 启动前请确认无占用 |
| **SQLite** | 3.x | Prisma 内置驱动，**无需**独立安装 |
| **操作系统** | macOS / Linux / Windows（推荐 WSL） | WSL 在 Windows 上获得最佳兼容性 |

快速检查：

```bash
node --version    # 应输出 v20.x 或更高
npm --version     # 应输出 10.x 或更高
ss -tlnp | grep -E ':3000|:3001'   # 端口应空闲
```

---

## 🚀 本地开发（5 分钟上手）

```bash
# 1) 后端
git clone https://github.com/hnlisf/fishgrow.git
cd fishgrow/backend
npm install
npm run build                  # nest build + tsc 编译 seed.ts
npx prisma migrate deploy      # 应用数据库迁移
npm run db:seed                # 10 个鱼种 + 演示用户 + 演示鱼缸 + 1 条金鱼
npm run start                  # → http://localhost:3000
# Swagger: http://localhost:3000/api/docs

# 2) 前端（新开终端）
cd ../frontend
npm install
echo 'NEXT_PUBLIC_API_URL=http://localhost:3000' > .env.local
npm run dev                    # → http://localhost:3001
```

打开 http://localhost:3001，系统已自动初始化一个演示鱼缸，里面有一条名为「小金」的金鱼。

---

## 📁 项目结构

```
fishgrow/
├── backend/                    # NestJS + Prisma + SQLite 后端
│   ├── src/                    # 模块：fish-species, fish-tanks, fish,
│   │                           #   feeding-advice, location, weather, reminders
│   ├── prisma/                 # schema.prisma + migrations + seed.ts
│   └── test/                   # e2e 集成测试
├── frontend/                   # Next.js 14 + Tailwind + next-intl 前端
│   ├── src/app/                # 页面：/, /species, /tank, /feed, /reminders
│   └── messages/               # 多语言：zh.json, en.json, ja.json
├── .github/workflows/ci.yml    # CI：lint + test + build
├── DEPLOY.md                   # Vercel + Railway 免费部署详细指南
└── README.md                   # 本文件
```

---

## 📊 API 概览

**Base URL**：`http://localhost:3000`，Swagger 文档：`/api/docs`。所有接口支持 `?lang=zh|en|ja`。

| Method | Path | 说明 |
|--------|------|------|
| GET    | `/api/fish-species`         | 鱼种列表，支持 `?lang=` |
| GET    | `/api/fish-species/:id`     | 鱼种详情 |
| POST   | `/api/fish-species/custom`  | 创建用户自定义鱼种 |
| GET    | `/api/fish-tanks?userId=`   | 鱼缸列表，支持 `?lang=` |
| POST   | `/api/fish-tanks`           | 创建鱼缸 |
| GET    | `/api/fish-tanks/:id`       | 鱼缸详情 |
| GET    | `/api/fish?tankId=`         | 鱼只列表，支持 `?lang=` |
| POST   | `/api/fish`                 | 创建鱼只 |
| PUT    | `/api/fish/:id`             | 更新鱼只 |
| DELETE | `/api/fish/:id`             | 删除鱼只 |
| POST   | `/api/fish/:id/feed`        | 喂食（自动校验喂食频率） |
| GET    | `/api/location`             | IP → 经纬度/城市（缓存 24h） |
| GET    | `/api/weather?lat=&lon=`    | 当前天气（缓存 30 分钟） |
| GET    | `/api/feeding-advice?userId=` | 基于天气的每条鱼喂食建议 |
| GET/POST/PUT/DELETE | `/api/reminders` | 提醒事项完整 CRUD |
| POST   | `/api/reminders/ensure-defaults` | 基于鱼种自动派生默认提醒 |

---

## 🧪 测试

```bash
cd backend && npm test         # Jest 单元/集成测试
cd frontend && npm test        # Next.js 组件测试
```

覆盖：鱼种 CRUD、喂食频率校验、提醒派生、Open-Meteo URL 构造、Seed 幂等性、locale-prefix 路由与语言切换器。

---

## 🌐 部署到生产

> 完整步骤与排错请阅读 [`DEPLOY.md`](./DEPLOY.md)。下面给关键摘要。

### 架构

```
┌──────────────────┐         ┌──────────────────────┐
│  Vercel (Free)   │ ──API──▶│  Railway (Free)      │
│  Next.js 前端    │         │  NestJS 后端         │
│  fishgrow.vercel │         │  *.up.railway.app    │
│  .app            │         │  + SQLite Volume     │
└──────────────────┘         └──────────────────────┘
```

### 后端：Railway

| 配置项 | 值 |
|---|---|
| Root Directory | `backend` |
| Build Command | `npm ci && npx prisma generate && npx prisma migrate deploy && npx prisma db seed && npm run build` |
| Start Command | `node --enable-source-maps dist/src/main.js` |
| Healthcheck | `/api/fish-species` |

**关键**：添加 Volume 挂载到 `/app/backend/prisma`（不挂载则每次重启数据库被清空），设置 `DATABASE_URL=file:./prisma/dev.db`。验证 Swagger：`https://<your-app>.up.railway.app/api/docs`。

### 前端：Vercel

| 配置项 | 值 |
|---|---|
| Root Directory | `frontend` |
| Build Command | `npm run build` |
| Install Command | `npm ci` |

**关键**：设置 `NEXT_PUBLIC_API_URL=https://<your-app>.up.railway.app`（后端 URL）。验证：跳转到 `/tank`，鱼种下拉框展示对应语言的 10 种鱼。

### 公网 / 局域网访问

编辑 `frontend/.env.local`：`NEXT_PUBLIC_API_URL=http://<本机局域网 IP>:3000`，然后 `npm run build && npm run start`。不修改变量时浏览器请求会指向浏览器本地的 `localhost`，导致 API 请求失败。

### 首次部署常见坑

- **Volume 路径必须正确**：挂载到 SQLite 文件所在目录，否则重启清库。
- **迁移是幂等的**：`prisma migrate deploy` 可重复运行；线上不要用 `migrate dev`。
- **Seed 幂等**：每次部署都跑 `prisma db seed` 不会重复插入。
- **CORS**：生产环境设置 `CORS_ORIGIN` 为 Vercel 域名（开发环境为 `*`）。
- **免费额度休眠**：Railway 空闲后休眠，冷启动约 30 秒；Vercel 无此问题。

---

## 📝 许可证

本项目采用 [MIT](./LICENSE) 许可证。

---

## 🤝 贡献

欢迎 PR！这是 FishGrow 6 智能体研发团队协作产出的 MVP 演示项目。提交规范参考 Conventional Commits（`feat:` / `fix:` / `refactor:` / `docs:` / `test:` / `chore:`）。

---

## 📮 联系方式

- **GitHub 仓库**：https://github.com/hnlisf/fishgrow
- **问题反馈**：通过 GitHub Issues 提交
- **部署详细文档**：[DEPLOY.md](./DEPLOY.md)

---

> 本文档由 FishGrow 6 智能体研发团队维护，最后更新于 2026-06-13