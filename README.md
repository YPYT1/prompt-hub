# Prompt Hub

一个现代化的提示词管理平台，支持用户注册登录、提示词管理、广场分享等功能。基于 Next.js 16 构建，部署在 Cloudflare Workers + D1 上。

## 技术栈

- **框架**: Next.js 16 (App Router)
- **样式**: Tailwind CSS v4
- **动画**: Motion (framer-motion 替代)
- **部署**: Cloudflare Workers + D1 (via OpenNext)
- **数据库**: Cloudflare D1 (SQLite)

## 功能特性

- ✅ 用户注册/登录（Cookie 会话）
- ✅ 提示词 CRUD（私有，按用户隔离）
- ✅ 标签管理（层级、分组）
- ✅ 广场功能（发布、点赞、收藏、评论）
- ✅ 响应式设计 + 深色模式
- ✅ 高级动效

## 本地开发

### 1. 安装依赖

```bash
pnpm install
```

### 2. 创建 D1 数据库

```bash
# 创建数据库
npx wrangler d1 create prompt_hub

# 将返回的 database_id 填入 wrangler.toml
```

编辑 `wrangler.toml`，替换 `YOUR_DATABASE_ID`：

```toml
[[d1_databases]]
binding = "DB"
database_name = "prompt_hub"
database_id = "你的数据库ID"
preview_database_id = "你的数据库ID"
```

### 3. 应用数据库迁移

```bash
# 本地
npx wrangler d1 migrations apply DB --local

# 远程（部署前）
npx wrangler d1 migrations apply DB --remote
```

### 4. 启动开发服务器

```bash
pnpm dev
```

### 5. 本地预览（Workers 运行时）

```bash
pnpm preview
```

## 部署到 Cloudflare

### 方式一：CLI 部署

```bash
# 1. 登录 Cloudflare
npx wrangler login

# 2. 创建 D1 数据库（如未创建）
npx wrangler d1 create prompt_hub

# 3. 更新 wrangler.toml 中的 database_id

# 4. 应用远程迁移
npx wrangler d1 migrations apply DB --remote

# 5. 部署
pnpm deploy
```

### 方式二：Git 集成部署

1. 将代码推送到 GitHub/GitLab
2. 在 [Cloudflare Dashboard](https://dash.cloudflare.com) 创建 Workers 项目
3. 连接你的 Git 仓库
4. 设置构建命令：`pnpm run build`
5. 设置构建输出目录：`.open-next`
6. 在 Settings > Variables 中绑定 D1 数据库

## 项目结构

```
prompt-hub/
├── app/                    # Next.js App Router
│   ├── api/               # API 路由
│   │   ├── auth/          # 鉴权 API
│   │   ├── posts/         # 帖子 API
│   │   ├── prompts/       # 提示词 API
│   │   └── tags/          # 标签 API
│   ├── login/             # 登录页
│   ├── register/          # 注册页
│   ├── square/            # 广场页
│   ├── tags/              # 标签管理页
│   └── page.tsx           # 首页（提示词管理）
├── components/            # React 组件
├── lib/                   # 工具库
│   ├── auth/              # 会话管理
│   ├── db/                # D1 数据库访问
│   ├── types/             # TypeScript 类型
│   └── utils/             # 工具函数
├── migrations/            # D1 数据库迁移
├── public/                # 静态资源
├── open-next.config.ts    # OpenNext 配置
├── wrangler.toml          # Wrangler 配置
└── package.json
```

## 环境变量

本地开发时在 `.dev.vars` 中设置：

```
NEXTJS_ENV=development
```

## 常用命令

| 命令 | 说明 |
|------|------|
| `pnpm dev` | 启动开发服务器 |
| `pnpm build` | 构建 Next.js |
| `pnpm preview` | 本地预览（Workers 运行时） |
| `pnpm deploy` | 部署到 Cloudflare |
| `pnpm cf-typegen` | 生成 Cloudflare 类型声明 |

## 注意事项

1. **D1 数据库**：每次修改 `wrangler.toml` 后需重新运行 `pnpm cf-typegen`
2. **迁移**：新增表结构时在 `migrations/` 目录创建新的 SQL 文件
3. **会话**：使用 HTTP-only Cookie，有效期 7 天
4. **密码**：使用 SHA-256 哈希存储（生产环境建议使用 bcrypt）

## License

MIT
