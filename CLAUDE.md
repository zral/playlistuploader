# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Listify** - Full-stack web application that converts text-based playlists into Spotify playlists with intelligent song matching, confidence scoring, and AI-powered playlist generation.

- **Frontend**: Svelte 4 + Vite (dev: port 5173, prod: port 80)
- **Backend**: Node.js 20 + Express.js (port 3000)
- **Database**: MongoDB 7 (session storage)
- **Cache**: Redis 7 (Spotify API response caching)
- **Deployment**: Docker Compose with Nginx reverse proxy

## Architecture

### Request Flow

```
User Browser
    ↓
Frontend (Svelte) - localhost:5173
    ↓ /api/* proxied by Vite
Backend (Express) - localhost:3000
    ├─ Redis (Cache) - localhost:6379
    ├─ MongoDB (Sessions) - localhost:27017
    └─ Spotify Web API (External)
```

### OAuth 2.0 Flow

1. User clicks login → `/auth/login` generates Spotify OAuth URL
2. State parameter stored in httpOnly cookie (10 min expiry, CSRF protection)
3. Spotify redirects to `/auth/callback?code=xxx&state=xxx`
4. Backend validates state, exchanges code for access/refresh tokens
5. Tokens + user ID stored in MongoDB session (30 day expiry)
6. User ID stored in httpOnly cookie for session validation
7. Auto-refresh tokens when < 5 minutes remain

### Production Resilience & Performance Patterns

The backend implements enterprise-grade resilience and performance optimizations:

- **Redis Caching** (Phase 12): 60-80% reduction in Spotify API calls
  - Search results: 1-hour TTL
  - User playlists: 15-minute TTL
  - User profiles: 30-minute TTL
  - Graceful fallback if Redis unavailable
- **Circuit Breaker** (via Opossum): Opens at 50% error rate, resets after 30s
- **Retry Logic** (via axios-retry): 3 retries with exponential backoff for 429/5xx errors
- **Request Timeouts**: 5 seconds on all Spotify API calls
- **Graceful Degradation**: Returns empty arrays instead of throwing errors when circuit is open

See `backend/src/services/spotifyService.js` for implementation.

### Rate Limiting Strategy

Tiered rate limiting prevents abuse while maintaining UX:

- **Auth endpoints** (`/auth/*`): 5 requests per 15 minutes (brute-force protection)
- **Single search** (`/api/search`): 50 requests per minute
- **Batch search** (`/api/search/batch`): 10 requests per minute (more expensive)
- **General API** (`/api/*`): 100 requests per 15 minutes

MongoDB store ensures limits persist across restarts.

### Structured Logging

Production uses Winston with JSON logging:

- **Log files**: `backend/logs/`
  - `error-YYYY-MM-DD.log` (14 day retention, errors only)
  - `combined-YYYY-MM-DD.log` (7 day retention, all levels)
  - `http-YYYY-MM-DD.log` (7 day retention, HTTP requests)
- **Log rotation**: Daily with gzip compression
- **Helper functions**:
  - `logger.logError(error, context)`
  - `logger.logSpotifyApiCall(endpoint, success, metadata)`
  - `logger.logDatabaseOperation(operation, success, metadata)`
  - `logger.logCircuitBreaker(state, metadata)`

## Key File Structure

```
backend/src/
├── server.ts              # Express setup, middleware mounting, route registration
├── config/config.ts       # Environment variables, Spotify OAuth scopes, AI config
├── cache/
│   └── redis.ts          # IORedis connection with retry strategy, event logging
├── routes/
│   ├── auth.ts           # OAuth flow: /auth/login, /auth/callback, /auth/logout, /auth/me
│   ├── api.ts            # API endpoints: /api/search, /api/search/batch, /api/playlists
│   └── aiRoutes.ts       # AI endpoints: /api/ai/generate-playlist, /api/ai/status
├── services/
│   ├── spotifyService.ts # Spotify API wrapper with caching, circuit breaker, retry, timeout
│   └── aiService.ts      # AI service with OpenRouter/Groq/OpenAI support
├── middleware/
│   ├── rateLimiter.ts    # Tiered rate limiting with MongoDB store
│   ├── cache.ts          # Response caching middleware with X-Cache headers
│   └── aiRateLimit.ts    # AI-specific rate limiting (user daily, IP hourly)
├── db/mongodb.ts         # Session storage with TTL indexes
├── types/                # TypeScript type definitions
│   ├── spotify.ts        # Spotify API types
│   ├── config.ts         # Configuration types
│   └── ...
└── utils/
    ├── logger.ts         # Winston structured JSON logging
    ├── cache.ts          # High-level cache utilities (search, playlists, profiles)
    └── aiPrompts.ts      # AI prompt templates and message builders

frontend/src/
├── App.svelte            # Root: auth check, notification system, layout
├── components/
│   ├── PlaylistUploader.svelte      # Main UI: text/CSV input, search, export
│   ├── AIPlaylistGenerator.svelte   # AI playlist generation UI (NEW)
│   ├── SongResults.svelte           # Results grid: confidence scores, alternatives
│   ├── Login.svelte                 # OAuth redirect button
│   ├── Header.svelte                # User info, logout
│   └── Notification.svelte          # Toast notification system
├── lib/api.ts            # Axios client: withCredentials, all API endpoints including AI
└── types/api.ts          # TypeScript types for all API requests/responses
```

## Common Commands

### Development

```bash
# Start all services (MongoDB, Backend with --watch, Frontend with HMR)
docker-compose up -d

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Restart after code changes (if hot reload fails)
docker-compose restart backend

# Stop all services
docker-compose down
```

### Testing

```bash
# Run all tests (98 tests: 75 backend + 53 frontend)
./run-tests.sh

# Run with coverage reports (65% threshold)
./run-tests.sh --coverage

# Backend tests only
./run-tests.sh --backend

# Frontend tests only (Vitest + Testing Library)
./run-tests.sh --frontend

# Watch mode (interactive)
./run-tests.sh --backend --watch
./run-tests.sh --frontend --watch

# Direct test commands (inside containers):
cd backend && npm test                 # Jest with ES modules
cd backend && npm run test:watch
cd frontend && npm test                # Vitest
cd frontend && npm run test:watch
```

### Production Deployment

```bash
# Build and start production containers
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d

# Check health
curl http://localhost/health

# View production logs
docker-compose -f docker-compose.prod.yml logs -f

# Manual database backup
./backup.sh

# Restore database
./restore.sh /path/to/backup-dir
```

## Environment Configuration

Copy `.env.example` to `.env` and configure:

**Required:**
- `SPOTIFY_CLIENT_ID` - From Spotify Developer Dashboard
- `SPOTIFY_CLIENT_SECRET` - From Spotify Developer Dashboard
- `SESSION_SECRET` - Generate with `openssl rand -base64 32`
- `REDIS_URL` - Redis connection URL (default: redis://redis:6379)
- `CACHE_ENABLED` - Enable/disable caching (default: true)

**AI Configuration (Phase 14):**
- `AI_PROVIDER` - Primary AI provider (openrouter, groq, or openai)
- `OPENROUTER_API_KEY` - OpenRouter API key from https://openrouter.ai/keys
- `OPENROUTER_MODEL` - Model to use (default: openai/gpt-3.5-turbo)
- `AI_RATE_LIMIT_PER_USER_DAILY` - Daily generations per user (default: 1000)
- `AI_RATE_LIMIT_PER_IP_HOURLY` - Hourly generations per IP (default: 500)
- `AI_MAX_SONGS_PER_REQUEST` - Max songs per request (default: 50)
- `AI_MAX_DURATION_MINUTES` - Max duration in minutes (default: 180)

**Redirect URI Setup:**
- Development: `http://localhost:3000/auth/callback`
- Production: `https://yourdomain.com/auth/callback`

**Important:** Add your Spotify account email to the app's User Management section (required for Development Mode apps).

## Testing Infrastructure

### Backend Tests (Jest)

- **Location**: `backend/src/**/__tests__/*.test.js`
- **Runner**: Jest with ES modules (`NODE_OPTIONS=--experimental-vm-modules`)
- **Mocking**: Dynamic imports for services, supertest for HTTP
- **Coverage**: 60% minimum (branches, functions, lines, statements)

### Frontend Tests (Vitest)

- **Location**: `frontend/src/**/*.test.js`
- **Runner**: Vitest with jsdom environment
- **Tools**: Testing Library for Svelte, component testing
- **Coverage**: 60% minimum

### Docker Test Containers

All tests run in isolated Docker containers via `docker-compose.test.yml`:
- `backend-test` - Jest runner
- `backend-test-coverage` - Jest with coverage
- `frontend-test` - Vitest runner
- `frontend-test-coverage` - Vitest with coverage

## Important Patterns

### CSV Parsing

The app handles multiple CSV formats:

- **Shazam format**: Detects and skips "Shazam Library" title row
- **Generic format**: Case-insensitive detection of Title/Artist columns
- **Column names**: Accepts `title`, `song`, `track` / `artist`, `artistname`
- **Quoted values**: Handles CSV quoted values and embedded commas

See `frontend/src/components/PlaylistUploader.svelte:parseCSV()`

### Batch Search Optimization

- Maximum 100 songs per batch request
- Confidence scoring: 0-100% based on Spotify search rank
- Alternative suggestions: Up to 3 alternatives per song
- Parallel processing on backend

### Session Management

Hybrid approach for distributed systems:
- **httpOnly cookie**: User ID only (30 day expiry)
- **MongoDB store**: Access/refresh tokens, user profile (30 day TTL)
- **Auto-cleanup**: MongoDB TTL index removes expired sessions
- **Fast validation**: No network calls for session check

## API Endpoints

### Authentication

- `GET /auth/login` - Returns Spotify OAuth URL
- `GET /auth/callback?code=xxx&state=xxx` - Handle OAuth redirect
- `GET /auth/me` - Get current user (requires auth)
- `POST /auth/logout` - Clear session

### Search & Playlists

- `POST /api/search` - Search single track
  - Body: `{ query: "Artist - Song" }`
  - Returns: Array of track objects with confidence scores

- `POST /api/search/batch` - Search multiple tracks (max 100)
  - Body: `{ queries: ["Artist - Song", ...] }`
  - Returns: Array of results with alternatives

- `GET /api/playlists` - Get user's owned playlists
- `POST /api/playlists` - Create new playlist
  - Body: `{ name: "Playlist Name", description?: string, public?: boolean }`

- `POST /api/playlists/:playlistId/tracks` - Add tracks
  - Body: `{ trackUris: ["spotify:track:xxx", ...] }`

### AI Endpoints (NEW - Phase 14)

- `POST /api/ai/generate-playlist` - Generate AI playlist
  - Body: `{ description: string, songCount?: number, durationMinutes?: number }`
  - Returns: `{ success: true, playlist: string, metadata: { songCount, generationTime } }`
  - Rate limited: 1000/day per user, 500/hour per IP

- `GET /api/ai/status` - Get AI service status
  - Returns: `{ provider: string, configured: boolean, fallbackProvider?: string }`

## Docker Compose Environments

### Development (`docker-compose.yml`)
- MongoDB on port 27017 (accessible from host)
- Redis on port 6379 (accessible from host, 256MB memory)
- Backend with `npm run dev` (--watch mode, hot reload)
- Frontend with Vite dev server (HMR, port 5173)
- Vite proxies `/api/*` and `/auth/*` to backend

### Production (`docker-compose.prod.yml`)
- MongoDB (no external port, internal network only)
- Redis (no external port, internal network only, 512MB memory, LRU eviction)
- Backend with `npm start` (production mode)
- Frontend with Nginx (static files, port 80)
- Automated daily backup service (7-day retention)
- All services have health checks

### Testing (`docker-compose.test.yml`)
- Isolated test network
- 4 test containers (backend/frontend × test/coverage)
- No persistence, clean slate per run

## Backup & Restore

### Automated Backups
- Daily backups via `mongodb-backup` container (docker-compose.prod.yml)
- Location: `./backups/backup-YYYYMMDD-HHMMSS/`
- Retention: 7 days (configurable via `BACKUP_RETENTION_DAYS`)

### Manual Operations
```bash
# Backup
./backup.sh
# Creates: ./backups/manual-backup-TIMESTAMP/

# Restore
./restore.sh ./backups/backup-20251215-120000
# Confirms before restoring, uses --drop flag
```

## Known Limitations

### Spotify Development Mode

Apps with < 25 users are in Development Mode:
- `preview_url` always returns `null` (no 30-second previews)
- Must manually add users in Spotify Developer Dashboard → User Management
- Apply for Extended Quota Mode to lift restrictions

### OAuth Redirect URIs

- Local development uses `127.0.0.1` (not `localhost`) for consistency
- Production requires HTTPS with valid domain
- Exact URI must match in Spotify Developer Dashboard settings

## Debugging

### Query Logs

```bash
# View error logs only
jq 'select(.level == "error")' backend/logs/combined-*.log

# View Spotify API calls
jq 'select(.message == "Spotify API call")' backend/logs/combined-*.log

# View circuit breaker events
jq 'select(.message | contains("Circuit breaker"))' backend/logs/combined-*.log
```

### Common Issues

**OAuth fails with "redirect_uri_mismatch":**
- Check `SPOTIFY_REDIRECT_URI` in `.env` matches Spotify Dashboard
- Verify domain exactly matches (http vs https, port number)

**Tests fail with "Cannot find module":**
- Ensure `NODE_OPTIONS=--experimental-vm-modules` is set for Jest
- Check `"type": "module"` in package.json

**Frontend can't reach backend API:**
- Verify Vite proxy configuration in `frontend/vite.config.js`
- Check backend is running: `curl http://localhost:3000/health`
- Ensure containers are on same network: `docker network inspect spotifyuploader_spotify-network`

## Phase Documentation

The repository includes comprehensive phase documentation in the `doc/` directory:

- `doc/PHASE1.md` - Project Foundation
- `doc/PHASE2.md` - Spotify OAuth Integration
- `doc/PHASE3.md` - Spotify API Integration
- `doc/PHASE4.md` - Frontend Development
- `doc/PHASE5.md` - CSV Import Feature
- `doc/PHASE6.md` - Production Deployment
- `doc/PHASE7.md` - Documentation & Deployment Guide
- `doc/PHASE8.md` - Automated Testing (98 tests implemented)
- `doc/PHASE9.md` - Request Timeouts & Circuit Breaker
- `doc/PHASE10.md` - Database Backup Strategy
- `doc/PHASE11.md` - Structured Logging with Winston
- `doc/PHASE12.md` - Redis Caching Layer (60-80% API reduction)
- `doc/PHASE13.md` - TypeScript Migration (Full backend + frontend)
- `doc/PHASE14.md` - AI Playlist Generator (OpenRouter + GPT-3.5 Turbo)
- `doc/ANALYZIS.md` - Code quality analysis (9/10 rating)
- `doc/PLAN_OFT.md` - Oracle Cloud Free Tier deployment guide
- `doc/PLAN.md` - Complete implementation plan with all phases
- `doc/PLAN_AIPLAYLIST.md` - AI playlist generation feature plan (IMPLEMENTED)

## Development Workflow

When adding new features:

1. **Backend API**:
   - Add route in `backend/src/routes/api.js`
   - Add business logic in `backend/src/services/spotifyService.js`
   - Add tests in `backend/src/routes/__tests__/api.test.js`
   - Update logger calls for observability

2. **Frontend**:
   - Add API endpoint in `frontend/src/lib/api.js`
   - Create/update component in `frontend/src/components/`
   - Add tests in `frontend/src/components/__tests__/`
   - Update App.svelte if needed for routing/layout

3. **Testing**:
   ```bash
   ./run-tests.sh --coverage
   # Ensure 65%+ coverage maintained
   ```

4. **Documentation**:
   - Update README.md with user-facing changes
   - Add technical details to appropriate doc/PHASE*.md file
   - Update doc/ANALYZIS.md if affecting code quality metrics
   - Update doc/PLAN.md to track implementation progress
