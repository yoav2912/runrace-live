# RunRace Live

Real-time competitive GPS running platform — **Call of Duty ranked mode + Strava** for outdoor racing.

## Monorepo structure

```
runrace-live/
├── apps/
│   ├── mobile/          # React Native (Expo) — runner app
│   └── admin/           # Vite React — ops dashboard
├── backend/             # Node.js + TypeScript API + Socket.IO
├── packages/shared/     # Shared types, constants, socket contracts
└── README.md
```

## Features implemented

| Area | Status |
|------|--------|
| Auth (Supabase OAuth → JWT) | ✅ |
| Live races + lobby codes | ✅ |
| Socket.IO GPS sync + leaderboard | ✅ |
| Multilayer anti-cheat engine | ✅ |
| Matchmaking queue | ✅ |
| PostgreSQL schema | ✅ |
| Gamification (XP, leagues, badges tables) | ✅ |
| Wallet/tournament architecture | ✅ (schema + service) |
| Admin panel | ✅ |
| Dark competitive UI | ✅ |
| Google Maps live race map | ✅ |

## Prerequisites

- Node.js 20+
- PostgreSQL 15+ (PostGIS optional)
- Supabase project (auth)
- Google Maps API key (mobile)
- Expo Go or dev build (iOS/Android)

## Quick start

### 1. Install dependencies

```bash
npm install
npm run build -w @runrace/shared
```

### 2. Database

```bash
createdb runrace_live
psql -d runrace_live -f backend/migrations/001_initial_schema.sql
```

Copy env files:

```bash
cp backend/.env.example backend/.env
cp apps/mobile/.env.example apps/mobile/.env
cp apps/admin/.env.example apps/admin/.env
```

Edit `backend/.env` with your `DATABASE_URL` and `JWT_SECRET`.

### 3. Run backend

```bash
npm run dev:backend
```

Health check: `http://localhost:4000/health`

### 4. Run mobile app

```bash
npm run dev:mobile
```

Set `EXPO_PUBLIC_API_URL` to your machine IP when testing on a physical device.

### 5. Run admin dashboard

```bash
npm run dev:admin
```

Open `http://localhost:5173` — uses `x-admin-key` header.

## API overview

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/login` | Exchange Supabase user → app JWT |
| GET | `/api/users/me` | Profile + stats |
| POST | `/api/races` | Create race |
| POST | `/api/races/join` | Join by code |
| POST | `/api/races/matchmaking/queue` | Public matchmaking |
| GET | `/api/gamification/leaderboard/global` | Rankings |
| GET | `/api/admin/*` | Admin (API key) |

## Socket.IO events

**Client → Server:** `race:join`, `race:ready`, `gps:update`, `race:spectate`, `voice:signal`

**Server → Client:** `race:updated`, `race:countdown`, `leaderboard:update`, `racer:position`, `race:finished`, `anti-cheat:warning`

Contracts live in `packages/shared/src/types/socket.ts`.

## Anti-cheat layers

1. **Client sensors** — accelerometer bundled with GPS updates
2. **Server rules** — speed, GPS jumps, linear patterns, teleport, mock/root flags
3. **Trust score** — persisted per user; low trust blocks matchmaking
4. **Audit logs** — `anti_cheat_logs` + admin review
5. **ML hook** — `ML_CHEAT_WEBHOOK_URL` for future model scoring

## Architecture notes

- **Race engine** — in-memory for sub-second latency; persisted to Postgres
- **Wallet service** — entry fees/prizes without gambling logic; KYC field on users
- **Wearables** — settings placeholder; integrate HealthKit / Google Fit in `services/wearables/`
- **Scale path** — Redis adapter for Socket.IO, race sharding, read replicas

## Production checklist

- [ ] Rotate `JWT_SECRET` and `ADMIN_API_KEY`
- [ ] Enable TLS + WSS
- [ ] Supabase RLS + production OAuth redirect URLs
- [ ] EAS build + push notification credentials
- [ ] Rate limits behind CDN/WAF
- [ ] PostGIS indexes for heatmaps

## License

Proprietary — RunRace Live.
