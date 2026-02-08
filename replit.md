# Kuznex - Crypto Trading & Exchange Platform

## Overview

Kuznex is a fully functional crypto trading and exchange platform built for "Kuznex Pvt Ltd," an Indian proprietary trading firm. The application features user authentication, a dashboard with wallet management, instant crypto swaps with live CoinGecko prices, automated crypto deposits with unique per-user deposit addresses (8-chain multichain support), manual admin-approved withdrawals with per-network fees, INR on/off ramp, AI-powered KYC using Google Gemini, and admin panel with impersonation, god mode sweep, and balance adjustment.

The project follows a monorepo structure with a React frontend (Vite), Express backend, and Supabase (external PostgreSQL) database. Uses blue brand theme with professional white styling.

## User Preferences

Preferred communication style: Simple, everyday language.
STRICT REQUIREMENT: Use external Supabase database (project will be migrated to private VPS).

## System Architecture

### Directory Structure
- `client/` — React frontend (Vite-based SPA)
  - `client/src/pages/` — Page components (home, login, dashboard, swap, deposit, inr, kyc, admin-kyc, admin-users, admin-withdrawals, not-found)
  - `client/src/components/ui/` — shadcn/ui component library
  - `client/src/hooks/` — Custom React hooks
  - `client/src/lib/` — Utilities (query client, cn helper, auth hooks)
- `server/` — Express backend
  - `server/index.ts` — Server entry point, middleware setup, watcher startup
  - `server/routes.ts` — API route registration (prefix all routes with `/api`)
  - `server/storage.ts` — Data access layer with IStorage interface (SupabaseStorage implementation)
  - `server/auth.ts` — Passport-local authentication setup with memorystore sessions
  - `server/supabase.ts` — Supabase client initialization (auto-detects swapped env vars)
  - `server/crypto.ts` — AES-256-GCM encryption, ethers.js wallet generation
  - `server/watcher.ts` — Background deposit watcher (Etherscan V2 Multichain API, 8 chains)
  - `server/static.ts` — Static file serving for production
  - `server/vite.ts` — Vite dev server middleware for development
- `shared/` — Shared code between client and server
  - `shared/schema.ts` — TypeScript interfaces and Zod validation schemas
  - `shared/constants.ts` — Platform configuration (admin wallets, bank details, currencies, CoinGecko IDs)

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Bundler**: Vite with HMR in development
- **Routing**: Wouter (lightweight client-side router)
- **State Management**: TanStack React Query for server state
- **UI Components**: shadcn/ui (new-york style) with Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming (light mode)
- **Forms**: React Hook Form with Zod validation via @hookform/resolvers
- **Icons**: Lucide React
- **Path aliases**: `@/` maps to `client/src/`, `@shared/` maps to `shared/`

### Backend Architecture
- **Framework**: Express 5 on Node.js
- **Language**: TypeScript, executed via tsx
- **HTTP Server**: Node.js `http.createServer` wrapping Express
- **API Convention**: All API routes prefixed with `/api`
- **Storage Pattern**: Interface-based (`IStorage`) with `SupabaseStorage` implementation using @supabase/supabase-js
- **Authentication**: Passport-local with bcrypt password hashing, memorystore sessions
- **Crypto**: ethers.js for wallet generation, AES-256-GCM for private key encryption
- **Deposit Watcher**: Background job (60s interval) using Etherscan V2 Multichain API across 8 chains
- **Build Output**: Server compiled to `dist/index.cjs` via esbuild; client built to `dist/public/`

### Database
- **Provider**: External Supabase (PostgreSQL)
- **Client**: @supabase/supabase-js with anon key
- **Schema Location**: `shared/schema.ts` — TypeScript interfaces
- **SQL Migration Files**: `supabase-schema.sql`, `supabase-migration-v2.sql`
- **Tables**: `users`, `user_wallets`, `swap_history`, `crypto_deposits`, `inr_transactions`, `transactions`
- **RLS**: Disabled on all tables for server-side anon key access
- **Field naming**: snake_case (e.g., kuznex_id, kyc_status, is_admin, created_at, tx_hash, deposit_address, private_key_enc)

### Authentication
- Passport-local strategy with bcrypt password hashing
- Session-based auth with memorystore (portable, no DB dependency for sessions)
- Session secret via SESSION_SECRET environment variable
- Auto-creates wallet entries with deposit addresses for all supported currencies on user registration
- Admin impersonation via session-based `impersonatingUserId`

### Environment Variables
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL (currently swapped with KEY in user's config)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon key (currently swapped with URL in user's config)
- `SUPABASE_DB_PASSWORD` — Supabase database password (for direct PG access)
- `SESSION_SECRET` — Express session secret
- `ENCRYPTION_KEY` — AES-256 key for encrypting user deposit wallet private keys (REQUIRED)
- `GEMINI_API_KEY` — Google Gemini API key for AI-powered KYC document analysis
- `ETHERSCAN_API_KEY` — Etherscan V2 Multichain API key (REQUIRED for deposit monitoring)
- `MASTER_PRIVATE_KEY` — Hot wallet private key for sending approved withdrawals (optional, warned if missing)
- `ADMIN_COLD_WALLET` — Safe cold wallet address for emergency sweeps (optional)

### API Endpoints
- `POST /api/auth/register` — Register new user (auto-generates deposit addresses)
- `POST /api/auth/login` — Login
- `POST /api/auth/logout` — Logout
- `GET /api/auth/me` — Get current user
- `GET /api/wallet` — Get user wallets with deposit addresses (auth required)
- `GET /api/prices` — Get live crypto prices from CoinGecko
- `POST /api/swap` — Execute crypto swap with 1% spread (KYC required)
- `GET /api/swap/history` — Get swap history (auth required)
- `GET /api/deposit/address` — Get user's unique deposit addresses (auth required)
- `GET /api/deposit/transactions` — Get deposit transaction history (auth required)
- `POST /api/withdraw` — Submit crypto withdrawal request (KYC required)
- `GET /api/withdraw/transactions` — Get withdrawal history (auth required)
- `POST /api/deposit/crypto` — Legacy: Submit crypto deposit for verification
- `GET /api/deposit/crypto/history` — Legacy: Get deposit history
- `GET /api/inr/bank-details` — Get admin bank details for INR deposits
- `POST /api/inr/deposit` — Submit INR deposit with UTR (KYC required)
- `POST /api/inr/withdraw` — Submit INR withdrawal (KYC required)
- `GET /api/inr/history` — Get INR transaction history
- `GET /api/kyc/status` — Get KYC status
- `POST /api/kyc/submit` — Submit KYC documents (AI-analyzed with Gemini)
- `GET /api/admin/kyc` — List submitted KYC users (admin)
- `PATCH /api/admin/kyc/:userId` — Approve/reject KYC (admin)
- `GET /api/admin/users` — List all users with wallets (admin)
- `GET /api/admin/withdrawals` — List pending withdrawals (admin)
- `POST /api/admin/withdrawals/:txId/approve` — Approve & send withdrawal (admin)
- `POST /api/admin/withdrawals/:txId/reject` — Reject & refund withdrawal (admin)
- `POST /api/admin/balance-adjust` — Manual balance add/subtract (admin)
- `POST /api/admin/sweep` — Emergency sweep all user deposit addresses to cold wallet (admin)
- `POST /api/admin/impersonate/:userId` — Impersonate user (admin)
- `POST /api/admin/stop-impersonation` — Stop impersonation
- `GET /api/network-config` — Get all 8 chain configs with fees/limits (public)

### Key Design Decisions
1. **External Supabase database** — Required for VPS portability, not using Replit's built-in database
2. **Auto-swap env var detection** — Handles user's swapped URL/KEY environment variables
3. **Memorystore sessions** — No database dependency for session management, portable
4. **Per-user deposit addresses** — Each user gets a single EVM address (works on all 8 chains) generated with ethers.js
5. **AES-256-GCM key encryption** — User deposit wallet private keys encrypted at rest using Node.js crypto
6. **Etherscan V2 multichain watcher** — Polls Etherscan V2 API every 60s across 8 chains: ETH (1), BSC (56), Polygon (137), Base (8453), Arbitrum (42161), Optimism (10), Avalanche (43114), Fantom (250)
7. **12-block confirmations** — Configurable per network before auto-crediting deposits
8. **Manual withdrawal approval** — All withdrawals require admin approval for security
9. **Per-network withdrawal fees** — Configurable in `shared/constants.ts` (e.g., ETH: 5 USDT, BSC: 0.5 USDT)
10. **Minimum deposit/withdrawal limits** — Dust spam prevention, configurable per chain
11. **God mode sweep** — Emergency button to sweep all user deposit wallets across all 8 chains to cold wallet
12. **1% spread on swaps** — Configurable in `shared/constants.ts` via `SWAP_SPREAD_PERCENT`
13. **Startup secret validation** — Server crashes with clear error if required secrets are missing

### Hybrid Fund System
- **Deposits**: Fully automated & real-time (Binance-style UI/UX)
  - Unique deposit addresses generated per user on signup
  - Background watcher detects incoming transactions
  - Progress bar shows block confirmations (e.g., 8/12)
  - Auto-credits user balance when confirmation threshold reached
  - Auto-refreshes transaction list every 10 seconds
- **Withdrawals**: Manual admin approval (strict control)
  - User submits withdrawal request (address + amount)
  - Balance deducted immediately, held in pending state
  - Admin approves (sends on-chain via MASTER_PRIVATE_KEY) or rejects (refunds balance)

### Scripts
- `npm run dev` — Start development server with Vite HMR
- `npm run build` — Build both client and server for production
- `npm run start` — Run production build
- `npm run check` — TypeScript type checking

## External Dependencies

### Database
- **Supabase** — External PostgreSQL database via @supabase/supabase-js
- **Tables**: users, user_wallets, swap_history, crypto_deposits, inr_transactions, transactions

### Frontend Libraries
- **@tanstack/react-query** — Server state management and data fetching
- **wouter** — Lightweight client-side routing
- **react-hook-form** + **zod** — Form handling and validation
- **Radix UI** — Accessible UI primitives (via shadcn/ui)
- **Tailwind CSS** — Utility-first CSS framework
- **Lucide React** — Icon library

### Backend Libraries
- **Express 5** — HTTP server framework
- **memorystore** — In-memory session store
- **express-session** — Session middleware
- **passport** / **passport-local** — Authentication
- **bcrypt** — Password hashing
- **ethers** — Ethereum wallet generation and transaction signing
- **axios** — HTTP client for CoinGecko/blockchain APIs
- **@google/generative-ai** — Gemini API for KYC document analysis

### External APIs
- **CoinGecko API** — Real-time crypto price feeds (BTC, ETH, BNB, USDT)
- **Etherscan V2 Multichain API** — Unified blockchain monitoring across 8 chains (single API key)
- **Google Gemini AI** — KYC document analysis and verification

## Recent Changes (2026-02-08)
- Expanded to 8-chain support: Ethereum (1), BSC (56), Polygon (137), Base (8453), Arbitrum (42161), Optimism (10), Avalanche (43114), Fantom (250)
- Added per-network fees, minimum deposit, and minimum withdrawal limits in shared/constants.ts
- Added startup security validation - server crashes with CRITICAL ERROR if required secrets are missing
- Watcher enforces minimum deposit amounts (ignores dust transactions below chain's minDeposit threshold)
- Withdrawal route now deducts network fee from amount, validates minimum withdrawal, and rejects if amount <= fee
- Admin withdrawal approval sends (amount - networkFee) on-chain; platform keeps the fee
- Added GET /api/network-config endpoint returning all chain configs with fees/limits
- Deposit UI now shows "Minimum Deposit: X USDT" per selected network
- Withdrawal UI shows dynamic network fee, minimum withdrawal, and "You Receive" calculation
- Client-side withdrawal validation blocks submit if amount < min withdrawal or amount <= fee
- Sweep now iterates across all 8 chains per deposit address
- Added verified token contracts for Arbitrum, Optimism, Avalanche, and Fantom (USDT, USDC, WETH, WBTC)
- Added ADMIN_COLD_WALLET env var support
- Implemented Hybrid Fund System: automated deposits + manual withdrawal approval
- Added per-user deposit address generation with ethers.js
- Added AES-256-GCM encryption for private keys
- Created Binance-style deposit UI with confirmation progress bars
- Added admin withdrawal approval/rejection panel
- Added God Mode: emergency sweep + manual balance adjustment
- Added transactions table for unified deposit/withdrawal tracking
