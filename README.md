# TokenScope

**Find the Best AI Model Access** — Search, compare, and review AI model API providers worldwide.

TokenScope is an information aggregation platform covering API relay stations, proxies, major free tiers, domestic direct connections, and open-source hosting services. Pure information aggregation — no transactions.

## Features

- 🔍 **Search & Filter** — Find AI model providers by type, pricing, certification, and more
- 📊 **Compare** — Side-by-side comparison of providers across metrics
- ⭐ **Reviews & Ratings** — Community-driven reviews and ratings
- 🆓 **Free Tier Tracking** — Discover free API access for popular models
- 🌐 **Bilingual** — Full Chinese and English support
- 📱 **Responsive** — Works on desktop and mobile

## Tech Stack

- **Frontend**: Next.js 16 + React 19 + TypeScript + Tailwind CSS v4
- **Backend**: Supabase (PostgreSQL + Auth + RLS)
- **Deployment**: Vercel + Cloudflare CDN
- **i18n**: Custom React context (zh/en)

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the result.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key (server-side only) |
| `NEXT_PUBLIC_SITE_URL` | No | Production site URL (for SEO) |

## Database Setup

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Run `supabase/schema.sql` in the SQL Editor
3. Run `supabase/schema-v2.sql` in the SQL Editor
4. Run `supabase/seed.sql` to populate sample data (optional)

## Deployment

See [DEPLOY.md](./DEPLOY.md) for detailed deployment instructions.

## License

MIT
