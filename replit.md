# Kuznex - Crypto Trading & Exchange Platform

## Overview

Kuznex is a comprehensive crypto trading and exchange platform designed for "Kuznex Pvt Ltd." It provides a secure and user-friendly environment for cryptocurrency transactions, featuring user authentication, an interactive dashboard with wallet management, and instant crypto swaps. The platform supports automated multi-chain crypto deposits with unique user addresses and manual, admin-approved withdrawals. It also incorporates INR on/off-ramp capabilities and AI-powered KYC using Google Gemini. A robust admin panel facilitates user management, impersonation, and balance adjustments. Key functionalities include a Binance-style spot trading interface with real-time data and an embedded TradingView chart, as well as portfolio analytics with daily snapshots and a 3D portfolio card. The project aims to deliver a secure and advanced platform for cryptocurrency exchange and trading, addressing the specific requirements of a proprietary trading firm and its users.

## User Preferences

Preferred communication style: Simple, everyday language.
STRICT REQUIREMENT: Use external Supabase database (project will be migrated to private VPS).

## Recent Changes

- **2026-02-13**: Implemented scan mutex/locking mechanism (`acquireScanLock`/`releaseScanLock`) to prevent concurrent Etherscan API calls. Recovery scan, processDeposits, and force-scan all serialize via a shared lock to avoid API rate limits (5 calls/sec on free tier).
- **2026-02-13**: Fixed Fantom RPC provider — changed from `rpc.ftm.tools` (401 errors) to `rpc.ankr.com/fantom`. Added `staticNetwork` option to all `JsonRpcProvider` instances to prevent infinite retry loops on network detection failures. Added timeout wrappers for RPC `getBlockNumber()` calls.
- **2026-02-13**: Made recovery scan (`scanMissingDeposits`) non-blocking at startup — runs in background while `processDeposits` starts after 5 seconds (serialized via scan lock).
- **2026-02-13**: Increased inter-chain delay from 250ms to 500ms in `processDeposits` to reduce Etherscan API rate limiting.
- **2026-02-13**: Added force-scan deposit feature: user-level `/api/deposit/force-scan` and admin-level `/api/admin/force-scan-all` endpoints. UI buttons added to deposit page and admin fund control panel.

## System Architecture

Kuznex is structured as a monorepo, comprising `client/` (React frontend), `server/` (Express backend), and `shared/` (common code).

### Frontend Architecture
- **Framework**: React 18 with TypeScript, using Vite as a bundler.
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
- **Deposit Watcher**: Dual-scan system using Etherscan V2 Multichain API + direct RPC providers across 8 chains (ETH, BSC, MATIC, BASE, ARB, OP, AVAX, FTM). RPC-first block number resolution for reliability. No minimum deposit limits. Includes `scanMissingDeposits()` transaction-based recovery function that runs on startup to detect and credit any missed deposits by tx_hash lookup. Auto-credits after 12 block confirmations. All scan operations (recovery, periodic, force-scan) are serialized via a mutex lock (`acquireScanLock`/`releaseScanLock`) to prevent concurrent Etherscan API calls and rate limiting.
- **Force-Scan Feature**: User-level force scan (`/api/deposit/force-scan`) scans only the authenticated user's deposit addresses. Admin-level force scan (`/api/admin/force-scan-all`) iterates all users sequentially. Both respect the scan lock.

### Database
- **Provider**: External Supabase (PostgreSQL).
- **Client**: `@supabase/supabase-js`.
- **Schema**: Defined in `shared/schema.ts` with tables such as `users`, `user_wallets`, `swap_history`, `crypto_deposits`, `inr_transactions`, `transactions`, `spot_orders`, and `daily_snapshots`.
- **Row Level Security (RLS)**: Disabled for server-side anon key access.
- **Field Naming**: `snake_case`.

### Core Features
- **Authentication**: Passport-local with bcrypt; automatically generates wallet entries for supported currencies upon user registration. Includes admin impersonation.
- **Admin Access Control**: Super admin email `rkrajput0777@gmail.com` with specific backend and frontend security measures (404 for unauthorized access).
- **Hybrid Fund System**: Automated real-time deposits with unique EVM addresses and a background watcher; manual admin-approved withdrawals with transactions managed by `MASTER_PRIVATE_KEY`.
- **Spot Trading Module**: Binance-style interface for 300+ pairs (e.g., BTC/USDT, ETH/USDT) with Binance WebSocket real-time data and embedded TradingView charts. Orders execute instantly at market price with a 0.1% trading fee.
- **Portfolio Analytics Module**: Daily snapshots of user portfolio values via cron job; dashboard displays total value, 24h PnL, and deposit/withdrawal stats on a 3D glassmorphism card. Admin analytics include net deposits and 24h activity with Whale/Risk indicators.
- **TDS Compliance Module (Section 194S)**: 1% TDS on crypto-to-INR swaps and INR withdrawals. Requires verified PAN card for non-admin users. Admin reports with CSV export available.
- **Contact Support System**: Public contact form and admin portal for message management (status: `new`, `replied`, `archived`).
- **Fiat Buy/Sell USDT**: Admin-approved workflow for INR to USDT (buy) and USDT to INR (sell) transactions, including TDS deduction on sell. Configurable buy/sell rates.
- **Admin Fund Control Module**: System-wide balance overview, sample on-chain balance check, emergency sweep to a cold wallet, and force-scan all deposits button.
- **Admin Fiat Settings Module**: Dynamic bank/UPI payment configuration with enable/disable toggles.
- **Admin Password Management**: Admins can reset non-admin user passwords.
- **Admin Crypto Withdrawal Approvals Module**: Manage pending crypto withdrawal requests, including on-chain sending and refunding.

## External Dependencies

### Database
- **Supabase**: External PostgreSQL database accessed via `@supabase/supabase-js`.

### Frontend Libraries
- **@tanstack/react-query**: Server state management.
- **wouter**: Client-side router.
- **react-hook-form** + **zod**: Form handling and validation.
- **Radix UI** (via **shadcn/ui**): Accessible UI components.
- **Tailwind CSS**: Styling.
- **Lucide React**: Icon library.

### Backend Libraries
- **Express 5**: HTTP server framework.
- **memorystore**: In-memory session store.
- **express-session**: Session management.
- **passport** / **passport-local**: Authentication.
- **bcrypt**: Password hashing.
- **ethers**: Ethereum wallet generation and transaction signing.
- **axios**: HTTP client.
- **@google/generative-ai**: Google Gemini API client.

### External APIs
- **CoinGecko API**: Real-time cryptocurrency price feeds.
- **Etherscan V2 Multichain API**: Unified blockchain monitoring across 8 supported chains (Ethereum, BSC, Polygon, Base, Arbitrum, Optimism, Avalanche, Fantom).
- **Google Gemini AI**: Strict KYC document validation (real-time verify-image endpoint with blurriness/photocopy/screenshot detection, extracted data, live selfie face verification). Auto-deletes uploaded files after admin decision.
- **Binance WebSocket**: Real-time spot trading price data.
