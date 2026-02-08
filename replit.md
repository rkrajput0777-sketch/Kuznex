# Kuznex - Crypto Trading & Exchange Platform

## Overview

Kuznex is a crypto trading and exchange platform designed for "Kuznex Pvt Ltd." It offers user authentication, a dashboard with wallet management, instant crypto swaps with live prices, automated multi-chain crypto deposits with unique per-user addresses, manual admin-approved withdrawals, INR on/off-ramp, and AI-powered KYC using Google Gemini. The platform also includes an extensive admin panel for user management, impersonation, and balance adjustments. Key capabilities include a Binance-style spot trading interface with real-time price data and an embedded TradingView chart, as well as portfolio analytics with daily snapshots and a 3D portfolio card.

The project aims to provide a robust, secure, and user-friendly platform for cryptocurrency exchange and trading, catering to the specific needs of a proprietary trading firm while offering advanced features for its users.

## User Preferences

Preferred communication style: Simple, everyday language.
STRICT REQUIREMENT: Use external Supabase database (project will be migrated to private VPS).

## System Architecture

Kuznex is built as a monorepo, separating the application into `client/` (React frontend), `server/` (Express backend), and `shared/` (common code).

### Frontend Architecture
- **Framework**: React 18 with TypeScript.
- **Bundler**: Vite.
- **Routing**: Wouter.
- **State Management**: TanStack React Query for server-side data.
- **UI Components**: shadcn/ui (New York style) built on Radix UI primitives.
- **Styling**: Tailwind CSS with CSS variables for theming.
- **Forms**: React Hook Form with Zod validation.
- **UI/UX Decisions**: Professional white styling with a blue brand theme, Binance-style interfaces for deposits and spot trading, and a glassmorphism 3D portfolio card on the dashboard.

### Backend Architecture
- **Framework**: Express 5 on Node.js with TypeScript.
- **API Convention**: All API routes are prefixed with `/api`.
- **Storage Pattern**: Interface-based (`IStorage`) with a `SupabaseStorage` implementation.
- **Authentication**: Passport-local strategy using bcrypt for password hashing and memorystore for session management.
- **Crypto Operations**: `ethers.js` for wallet generation and `AES-256-GCM` for private key encryption.
- **Deposit Watcher**: A background job that polls the Etherscan V2 Multichain API every 60 seconds across 8 chains to detect and auto-credit deposits after 12 block confirmations.

### Database
- **Provider**: External Supabase (PostgreSQL).
- **Client**: `@supabase/supabase-js`.
- **Schema**: Defined in `shared/schema.ts` with tables such as `users`, `user_wallets`, `swap_history`, `crypto_deposits`, `inr_transactions`, `transactions`, `spot_orders`, and `daily_snapshots`.
- **Row Level Security (RLS)**: Disabled for server-side anon key access.
- **Field Naming**: `snake_case`.

### Authentication
- Uses Passport-local with bcrypt for secure password hashing and memorystore for sessions.
- Automatically generates wallet entries with deposit addresses for all supported currencies upon user registration.
- Includes admin impersonation functionality.

### Admin Access Control (Security Hardened)
- **Super Admin Email**: Only `rkrajput0777@gmail.com` (hardcoded as `SUPER_ADMIN_EMAIL` in `shared/constants.ts`) can access admin routes.
- **Backend**: `requireAdmin` middleware checks both `is_admin` flag AND email match; returns **404 Not Found** (not 403) to prevent route discovery.
- **Frontend**: `AdminGuard` component (`client/src/components/admin-guard.tsx`) wraps all `/admin/*` routes in `App.tsx`; renders the generic 404 page for unauthorized users.
- **API Response**: `/api/auth/me` returns `isSuperAdmin: true` only when both `is_admin` and email match.
- **Inline admin checks**: Routes using `requireAuth` with inline admin checks (`/api/admin/user-stats`, `/api/admin/tds-report`) also verify email + return 404.

### Hybrid Fund System
- **Deposits**: Fully automated and real-time. Each user receives a unique EVM deposit address. A background watcher monitors transactions across 8 chains, crediting user balances upon reaching a configurable confirmation threshold.
- **Withdrawals**: Manual admin approval process. Users submit requests, balances are held, and administrators manually approve or reject, with on-chain transactions managed by a `MASTER_PRIVATE_KEY`.

### Spot Trading Module
- Provides a Binance-style trading interface for pairs like BTC/USDT, ETH/USDT, BNB/USDT.
- Utilizes Binance WebSocket for real-time price data and embeds a TradingView chart.
- Orders are executed instantly at market price with a configurable 0.1% trading fee.

### Portfolio Analytics Module
- **Daily Snapshots**: A cron job captures user portfolio values daily.
- **Dashboard Integration**: Displays total value, 24h PnL, and deposit/withdrawal stats on a 3D glassmorphism card.
- **Admin Analytics**: Provides insights into user net deposits and 24h activity, including Whale/Risk indicators.

## External Dependencies

### Database
- **Supabase**: External PostgreSQL database, accessed via `@supabase/supabase-js`.

### Frontend Libraries
- **@tanstack/react-query**: For server state management.
- **wouter**: Lightweight client-side router.
- **react-hook-form** + **zod**: For form handling and validation.
- **Radix UI** (via **shadcn/ui**): Accessible UI components.
- **Tailwind CSS**: For styling.
- **Lucide React**: Icon library.

### Backend Libraries
- **Express 5**: HTTP server framework.
- **memorystore**: In-memory session store.
- **express-session**: Session management.
- **passport** / **passport-local**: Authentication.
- **bcrypt**: Password hashing.
- **ethers**: Ethereum wallet generation and transaction signing.
- **axios**: HTTP client.
- **@google/generative-ai**: Google Gemini API client for AI-powered KYC.

### External APIs
- **CoinGecko API**: Real-time cryptocurrency price feeds.
- **Etherscan V2 Multichain API**: Unified blockchain monitoring across 8 supported chains (Ethereum, BSC, Polygon, Base, Arbitrum, Optimism, Avalanche, Fantom).
- **Google Gemini AI**: For KYC document analysis and verification.
- **Binance WebSocket**: For real-time spot trading price data.

### Portfolio Analytics Module
- **Daily Snapshots**: Background cron job (`server/snapshot-cron.ts`) captures user portfolio values at midnight UTC
- **Database**: `daily_snapshots` table (id, user_id, date, total_balance_usdt, created_at) with unique(user_id, date)
- **3D Portfolio Card**: Glassmorphism card with `vanilla-tilt.js` on dashboard showing total value, 24h PnL, deposit/withdrawal stats
- **Admin Analytics**: User management table includes Net Deposit and 24h Activity columns with Whale/Risk indicators
- **Migration**: `supabase-migration-v4-analytics.sql` — must be run in Supabase SQL Editor

### Portfolio Analytics API Endpoints
- `GET /api/user/stats` — Get user's 24h PnL, total deposited/withdrawn, current balance (auth required)
- `GET /api/admin/user-stats` — Get all users' analytics map with net deposit and 24h change (admin only)

### TDS Compliance Module (Section 194S)
- **TDS Rate**: 1% on crypto-to-INR swaps and INR withdrawals, defined in `shared/constants.ts` as `TDS_RATE`
- **PAN Verification**: Users must have a verified PAN card (from AI KYC) before selling crypto to INR or withdrawing INR
- **Admin Bypass**: Admin users are exempt from PAN verification requirement
- **Swap TDS**: Applied when `toCurrency === "INR"` — gross amount calculated, TDS deducted, net_payout credited to wallet
- **Withdraw TDS**: Applied on INR withdrawals — TDS deducted from withdrawal amount, net_payout sent to bank
- **Database**: `tds_amount` and `net_payout` columns on `swap_history` and `inr_transactions` tables
- **Admin Reports**: `/admin/tds-reports` page with date range filtering and CSV export for tax filing
- **Migration**: `supabase-migration-v5-tds.sql` — must be run in Supabase SQL Editor
- **Storage Methods**: `getTdsSwapRecords(from, to)` and `getTdsInrWithdrawRecords(from, to)` for date-filtered queries

### TDS API Endpoints
- `GET /api/admin/tds-report?from=YYYY-MM-DD&to=YYYY-MM-DD` — Get aggregated TDS records from swaps and INR transactions (admin only)

### Contact Support System
- **Database Table**: `contact_messages` (id, user_id nullable, name, email, subject, message, status, created_at)
- **Status Values**: `new`, `replied`, `archived`
- **Public Form**: `/contact` page with subject dropdown (Deposit Issue, KYC, Withdrawal, Technical, Account, Other)
- **Admin Portal**: `/admin/messages` with filter by status, expand to read, reply via mailto, mark replied/archived
- **Migration**: `supabase-migration-v6-contact.sql` — must be run in Supabase SQL Editor

### Contact API Endpoints
- `POST /api/contact` — Submit a contact message (public, optionally authenticated)
- `GET /api/admin/messages` — List all contact messages (admin only)
- `PATCH /api/admin/messages/:id` — Update message status (admin only)

### Legal Pages
- `/legal/privacy-policy` — Privacy Policy
- `/legal/terms` — Terms of Service
- `/legal/risk-disclosure` — Risk Disclosure
- `/legal/aml-policy` — Anti-Money Laundering Policy
- `/legal/tds-compliance` — TDS Compliance (Section 194S explanation)

### SEO
- Domain: `kuznex.in` (all canonical URLs, OG tags, sitemap use .in domain)
- Support email: `support@Kuznex.in` (across contact page, legal pages, meta tags)
- Global meta tags: title, description, massive keyword list, OG tags, Twitter cards optimized for Indian crypto keywords
- Per-page SEO via `react-helmet-async` with Helmet component on Home, Contact, and all Legal pages
- `sitemap.xml` — public pages only (home, login, contact, legal pages; auth-gated routes excluded)
- `robots.txt` — Disallow auth-gated routes (/swap, /trade, /deposit, /inr, /withdraw, /admin, /dashboard, /kyc)
- Canonical URL set to `https://kuznex.in/`

## Recent Changes (2026-02-08)
- Rebranded domain from kuznex.com to kuznex.in across all SEO, canonical URLs, OG tags, sitemap, robots.txt
- Updated all support emails from support@kuznex.com to support@Kuznex.in (contact page, legal pages, meta tags)
- Massive SEO keyword injection with 35+ India-focused crypto keywords
- Added Contact Us system: public form (/contact) + admin portal (/admin/messages)
- Created 5 legal pages: Privacy Policy, Terms, Risk Disclosure, AML Policy, TDS Compliance
- Full SEO optimization: meta tags, OG tags, sitemap.xml, robots.txt for Indian crypto keywords
- Updated Footer with working links to all legal pages, contact, and product routes
- Added admin Messages nav link in dashboard
- Added TDS (Tax Deducted at Source) compliance system per India VDA Section 194S
- 1% TDS deduction on crypto-to-INR swaps and INR withdrawals
- PAN card verification gating for sell/withdraw operations
- Admin TDS reports page with date filtering and CSV export
- TDS breakdown preview on swap and INR withdrawal UIs with tax disclaimer
- Added Portfolio Analytics with daily_snapshots table and midnight UTC cron job
- Built 3D glassmorphism Portfolio Card with vanilla-tilt.js on dashboard
- Added /api/user/stats endpoint for 24h PnL, total deposits/withdrawals
- Added /api/admin/user-stats endpoint for bulk user analytics
- Enhanced admin users panel with Net Deposit, 24h Activity columns, Whale/Risk indicators