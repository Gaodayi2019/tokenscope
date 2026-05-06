# TokenScope 部署指南

## 前置条件
- Node.js 18+
- [Supabase](https://supabase.com) 账号（免费即可）

## 1. Supabase 设置

1. 登录 Supabase → Create new project
2. 进入 SQL Editor → 粘贴 `supabase/schema.sql` 全部内容 → Run
3. 进入 Settings → API → 复制 Project URL 和 anon public key
4. 复制 service_role key（仅服务端用，绝不暴露前端）

## 2. 环境变量

```bash
cp .env.example .env.local
# 填入 Supabase 的 URL 和 Key
```

## 3. 本地开发

```bash
npm install
npm run dev
# 访问 http://localhost:3000
```

## 4. Vercel 部署

1. 推送代码到 GitHub
2. Vercel → Import Project → 选择仓库
3. Environment Variables 中添加 `.env.local` 中的变量
4. Deploy

## 5. 域名

- Vercel 默认提供 `.vercel.app` 域名
- 绑定自定义域名：Vercel Dashboard → Settings → Domains
- 推荐：`token-scope.com`

## 6. Cloudflare 加速（可选）

1. 域名 DNS 托管到 Cloudflare
2. CNAME 记录指向 Vercel
3. 开启 Proxy（橙色云朵）

## MVP 上线清单

- [ ] Supabase 项目创建 + schema 导入
- [ ] .env.local 配置
- [ ] 手动录入 20+ 渠道数据（Supabase Table Editor）
- [ ] Vercel 部署
- [ ] 自定义域名绑定
- [ ] 基本功能测试
- [ ] Google Analytics / 百度统计（可选）
