# WSL 部署指南（如果 Git 集成有问题）

## 1. 安装 WSL
```bash
# Windows 11/10
wsl --install
```

## 2. 在 WSL 中设置
```bash
# 更新包管理器
sudo apt update

# 安装 Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装 pnpm
npm install -g pnpm

# 克隆项目
cd ~
git clone https://github.com/YPYT1/prompt-hub.git
cd prompt-hub

# 安装依赖
pnpm install

# 登录 Cloudflare
npx wrangler login
```

## 3. 部署
```bash
# 构建
pnpm build

# 部署
pnpm deploy
```

## 4. 后续更新
```bash
# 拉取最新代码
git pull

# 部署
pnpm deploy
```
