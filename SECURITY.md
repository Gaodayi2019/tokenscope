# TokenScope 安全架构设计

## 一、当前数据存储位置

| 数据类型 | 当前位置 | 生产环境位置 |
|---------|---------|------------|
| 渠道信息 | `src/data/channels.ts` (静态文件) | **Supabase PostgreSQL** |
| 国际化文本 | `src/data/i18n.ts` (静态文件) | 保留在代码中 |
| 用户账户 | 无 | **Supabase Auth** |
| 用户评价 | 无 | **Supabase PostgreSQL** (RLS保护) |
| 管理员数据 | 无 | **Supabase** (Service Role Key保护) |
| 会话/限流 | 内存 (Map) | **Upstash Redis** |

### 核心原则：用户数据只有管理员（你本人）能访问

```
用户数据隔离架构：

普通用户 ──→ Supabase Auth (JWT) ──→ RLS策略 ──→ 只能读写自己的数据
管理员 ────→ Supabase Auth + MFA ──→ Service Role ──→ 全部数据
前端代码 ──→ 只有 Anon Key ──→ 任何敏感操作必须走后端API Route
```

---

## 二、安全防护层级（共7层）

### 第1层：基础设施层
| 防护 | 实现 |
|------|------|
| DDoS防护 | **Vercel** 内置（L3/L4/L7） |
| WAF | **Cloudflare** Web应用防火墙 |
| HTTPS | Vercel自动强制HTTPS + HSTS (2年max-age+preload) |
| CDN | Cloudflare 300+全球节点 |

### 第2层：HTTP安全头
已在 `next.config.ts` 中配置：
- **Content-Security-Policy** — 只允许加载同源资源+白名单域名
- **Strict-Transport-Security** — HSTS 2年+子域名+preload
- **X-Frame-Options: DENY** — 禁止iframe嵌入(防点击劫持)
- **X-Content-Type-Options: nosniff** — 禁止MIME嗅探
- **Permissions-Policy** — 禁用摄像头/麦克风/定位等API
- **Cross-Origin-*-Policy** — 严格同源策略
- **X-Request-ID** — 每个请求唯一追踪ID

### 第3层：请求过滤中间件
已在 `src/middleware.ts` 中实现：
- ✅ **SQL注入检测** — 拦截含UNION/SELECT/DROP等关键词的请求
- ✅ **XSS检测** — 拦截`<script>`/`javascript:`/事件处理器
- ✅ **路径黑名单** — 拦截.env/.git/wp-admin/phpmyadmin等探测
- ✅ **UA黑名单** — 拦截sqlmap/nikto/nmap/burpsuite等攻击工具
- ✅ **空UA拦截** — 无User-Agent的请求直接403
- ✅ **速率限制** — API 60/min, 认证 5/15min, 评价 3/5min

### 第4层：认证与授权
| 机制 | 实现 |
|------|------|
| 注册 | 邮箱+密码（12位+, 大小写+数字+特殊字符） |
| 登录 | Supabase Auth + JWT |
| MFA | 管理员强制TOTP双因素认证 |
| 会话 | 24小时过期，30分钟空闲超时 |
| CSRF | SameSite Cookie + CSRF Token |
| 密码存储 | bcrypt哈希（Supabase内置） |

### 第5层：数据隔离 (Supabase RLS)
```sql
-- 用户只能看到自己的数据
CREATE POLICY "Users can read own data" ON profiles
  FOR SELECT USING (auth.uid() = user_id);

-- 用户只能修改自己的评价
CREATE POLICY "Users can update own reviews" ON reviews
  FOR UPDATE USING (auth.uid() = user_id);

-- 管理员通过 Service Role Key 绕过RLS（仅后端API Route使用）
```

### 第6层：API安全
| 防护 | 实现 |
|------|------|
| 输入校验 | zod schema验证所有API输入 |
| 输出过滤 | 永不返回Service Role Key/密码等 |
| 限流 | Redis限流（API/认证/评价分级） |
| CORS | 严格同源 |
| 日志 | 请求ID追踪 + 异常告警 |

### 第7层：运维安全
| 项目 | 实现 |
|------|------|
| 环境变量 | .env.local不入Git，Vercel加密存储 |
| 依赖安全 | npm audit定期扫描 |
| 错误追踪 | Sentry异常监控 |
| 备份 | Supabase每日自动备份 + 7天保留 |
| 密钥轮换 | 每90天轮换JWT_SECRET和ENCRYPTION_KEY |

---

## 三、管理员专属安全

```
管理员登录流程：
1. 邮箱+密码登录 (Supabase Auth)
2. 强制MFA验证 (TOTP)
3. 验证管理员邮箱白名单 (ADMIN_EMAILS)
4. 获取Service Role权限
5. 30分钟空闲自动登出

管理员能做什么（普通用户不能）：
✅ 查看/导出所有用户数据
✅ 审核/删除评价
✅ 管理渠道信息
✅ 查看系统统计
✅ 配置网站设置
✅ 查看安全日志
```

---

## 四、已实现的文件

| 文件 | 功能 |
|------|------|
| `next.config.ts` | CSP/HSTS/X-Frame等12项安全头 |
| `src/middleware.ts` | SQL注入/XSS/路径探测/攻击工具/限流拦截 |
| `src/lib/security.ts` | 密码策略/输入过滤/邮箱验证/密码强度检测 |
| `.env.example` | 环境变量模板（标注哪些绝不暴露到前端） |
| `.gitignore` | 确保.env等敏感文件不入库 |

---

## 五、待实现（接入Supabase后）

- [ ] Supabase RLS策略SQL
- [ ] API Route认证中间件
- [ ] 管理员MFA设置页面
- [ ] 评价提交的zod schema验证
- [ ] Upstash Redis限流（替代内存Map）
- [ ] Sentry错误追踪集成
- [ ] 依赖安全扫描CI
