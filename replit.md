# Kuznex - Crypto Trading & Exchange Platform

## Overview

Kuznex is a fully functional crypto trading and exchange platform built for "Kuznex Pvt Ltd," an Indian proprietary trading firm. The application features a landing page with compliance/trust information, user authentication (register/login), a dashboard with wallet management, instant crypto swaps with live CoinGecko prices, crypto deposits (BSC/Polygon), and INR on/off ramp capabilities.

The project follows a monorepo structure with a React frontend (Vite), Express backend, and PostgreSQL database using Drizzle ORM. It uses a light/professional white theme with green accents for trust and credibility.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Directory Structure
- `client/` — React frontend (Vite-based SPA)
  - `client/src/pages/` — Page components (home, login, dashboard, swap, deposit, inr, not-found)
  - `client/src/components/ui/` — shadcn/ui component library
  - `client/src/hooks/` — Custom React hooks
  - `client/src/lib/` — Utilities (query client, cn helper, auth hooks)
- `server/` — Express backend
  - `server/index.ts` — Server entry point, middleware setup
  - `server/routes.ts` — API route registration (prefix all routes with `/api`)
  - `server/storage.ts` — Data access layer with IStorage interface (DatabaseStorage implementation)
  - `server/auth.ts` — Passport-local authentication setup with session management
  - `server/db.ts` — Drizzle ORM database connection
  - `server/static.ts` — Static file serving for production
  - `server/vite.ts` — Vite dev server middleware for development
- `shared/` — Shared code between client and server
  - `shared/schema.ts` — Drizzle ORM schema definitions and Zod validation schemas
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
- **Storage Pattern**: Interface-based (`IStorage`) with `DatabaseStorage` implementation using Drizzle ORM and PostgreSQL
- **Authentication**: Passport-local with bcrypt password hashing, express-session with connect-pg-simple session store
- **Build Output**: Server compiled to `dist/index.cjs` via esbuild; client built to `dist/public/`

### Database
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Location**: `shared/schema.ts` — shared between frontend and backend
- **Schema Push**: `npm run db:push` uses drizzle-kit to push schema to database
- **Connection**: Uses `DATABASE_URL` environment variable
- **Tables**: `users`, `user_wallets`, `swap_history`, `crypto_deposits`, `inr_transactions`
- **Validation**: Drizzle-Zod generates insert schemas from table definitions

### Authentication
- Passport-local strategy with bcrypt password hashing
- Session-based auth with PostgreSQL session store (connect-pg-simple)
- Session secret via SESSION_SECRET environment variable
- Auto-creates wallet entries for all supported currencies on user registration

### API Endpoints
- `POST /api/auth/register` — Register new user
- `POST /api/auth/login` — Login
- `POST /api/auth/logout` — Logout
- `GET /api/auth/me` — Get current user
- `GET /api/wallet` — Get user wallets (auth required)
- `GET /api/prices` — Get live crypto prices from CoinGecko
- `POST /api/swap` — Execute crypto swap with 1% spread (auth required)
- `GET /api/swap/history` — Get swap history (auth required)
- `GET /api/deposit/address` — Get admin deposit wallet addresses (auth required)
- `POST /api/deposit/crypto` — Submit crypto deposit for verification (auth required)
- `GET /api/deposit/crypto/history` — Get deposit history (auth required)
- `GET /api/inr/bank-details` — Get admin bank details for INR deposits (auth required)
- `POST /api/inr/deposit` — Submit INR deposit with UTR (auth required)
- `POST /api/inr/withdraw` — Submit INR withdrawal (auth required)
- `GET /api/inr/history` — Get INR transaction history (auth required)

### Key Design Decisions
1. **Monorepo with shared schema** — Single repository with shared TypeScript types between client and server eliminates type drift
2. **Interface-based storage** — `IStorage` interface with `DatabaseStorage` implementation for PostgreSQL
3. **shadcn/ui components** — Copy-paste component library gives full control over UI code without external dependency lock-in
4. **Vite dev / esbuild prod** — Vite provides fast HMR in development; esbuild bundles the server for production
5. **CoinGecko API** — Real-time crypto prices, refreshed every 15-30 seconds
6. **1% spread on swaps** — Configurable in `shared/constants.ts` via `SWAP_SPREAD_PERCENT`

### Scripts
- `npm run dev` — Start development server with Vite HMR
- `npm run build` — Build both client and server for production
- `npm run start` — Run production build
- `npm run check` — TypeScript type checking
- `npm run db:push` — Push Drizzle schema to PostgreSQL

## External Dependencies

### Database
- **PostgreSQL** — Primary database, connected via `DATABASE_URL` environment variable
- **Drizzle ORM** — Type-safe ORM for schema definition and queries
- **drizzle-kit** — Schema migration and push tooling

### Frontend Libraries
- **@tanstack/react-query** — Server state management and data fetching
- **wouter** — Lightweight client-side routing
- **react-hook-form** + **zod** — Form handling and validation
- **Radix UI** — Accessible UI primitives (via shadcn/ui)
- **Tailwind CSS** — Utility-first CSS framework
- **Lucide React** — Icon library

### Backend Libraries
- **Express 5** — HTTP server framework
- **connect-pg-simple** — PostgreSQL session store
- **express-session** — Session middleware
- **passport** / **passport-local** — Authentication
- **bcrypt** — Password hashing
- **axios** — HTTP client for CoinGecko API

### External APIs
- **CoinGecko API** — Real-time crypto price feeds (BTC, ETH, BNB, USDT)
