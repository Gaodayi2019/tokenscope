# TokenScope 项目方案

## 基本信息
- **项目名**: TokenScope
- **域名**: token-scope.com（首选，待注册）
- **定位**: 全球 AI 模型接入渠道的搜索、评价与推荐平台
- **收录范围**: 中转站/代理站、Token代理/经销商、大厂免费模型、国产低价模型直连、开源模型托管服务

## 已确认决策
| # | 事项 | 决定 |
|---|------|------|
| 1 | 域名 | token-scope.com |
| 2 | 技术栈 | Next.js + TypeScript + Tailwind CSS + shadcn/ui |
| 3 | 视觉风格 | 科技风、极简、暗色 |
| 4 | 部署 | Vercel 全球部署，后期加国内节点 |
| 5 | 国际化 | 中英双语，自动检测+手动切换 |
| 6 | 数据安全 | Supabase RLS + 管理员独占密钥 + MFA |
| 7 | 用户注册 | 邮箱注册，免费使用全部功能 |
| 8 | 备案 | MVP阶段不备案 |

## 技术栈详情
- **框架**: Next.js 16 (App Router)
- **语言**: TypeScript
- **样式**: Tailwind CSS 4 + shadcn/ui
- **数据库**: Supabase (PostgreSQL)
- **缓存**: Upstash Redis
- **CDN**: Cloudflare
- **部署**: Vercel (Hobby 免费)
- **国际化**: next-intl

## 视觉设计
- **风格**: 科技极简暗色风
- **主色调**: 靛蓝 #6366f1
- **辅助色**: 青色 #06b6d4、绿色(在线)、橙色(价格/警示)
- **字体**: Inter / Geist Sans + 思源黑体
- **圆角**: 大圆角 12-16px
- **参考**: Vercel.com / Linear.app

## 核心价值
1. 免费API接口 → 流量入口
2. 全渠道价格发现 → 核心能力
3. 真实用户评价 → 信任基石

## 商业模式（后期）
- 广告位
- 认证服务
- 导流佣金(CPS)
- 增值数据
- 社区运营

## 数据安全
- 全站 HTTPS
- Supabase Auth + JWT
- Row Level Security (RLS)
- 管理员独占 Service Role Key + MFA
- 每日自动备份
- API Key 仅存服务端环境变量
