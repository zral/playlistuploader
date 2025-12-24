# Listify Architecture Overview

This document provides a high-level architecture overview of Listify — covering runtime components, data flows, deployment topology, observability, and security boundaries. All diagrams use a dark theme with high-contrast colors for readability.

## System Architecture (Runtime Topology)

```mermaid
%%{init: {
  'theme': 'dark',
  'themeVariables': {
    'background': '#0f1419',
    'primaryTextColor': '#ffffff',
    'lineColor': '#ffd700',
    'nodeBorder': '#ffd700'
  }
}}%%
flowchart TD
  U[User Browser] -->|HTTPS| N[Nginx Reverse Proxy - Prod]
  N --> F[Frontend Svelte+Vite]
  F -->|CORS / JSON| B[Backend Express+TypeScript]

  B -->|Sessions| M[(MongoDB 7)]
  B -->|Cache| R[(Redis 7)]
  B -->|Spotify OAuth & Search| SP[[Spotify Web API]]
  B -->|AI Playlist Generation| AI[[OpenRouter API]]

  subgraph Dev[Docker Compose Dev]
    F
    B
    R
    M
  end

  subgraph Observability
    L[Winston Logging JSON]
  end

  B --> L

  classDef internal fill:#1a2028,stroke:#ffd700,color:#ffffff;
  classDef external fill:#165b33,stroke:#ffd700,color:#ffffff;
  class U,N,F,B,M,R internal;
  class SP,AI external;
```

---

## Technology Map

```mermaid
%%{init: {
  'theme': 'dark',
  'themeVariables': {
    'background': '#0f1419',
    'primaryTextColor': '#ffffff',
    'lineColor': '#ffd700',
    'nodeBorder': '#ffd700',
    'fontFamily': 'Poppins, Inter, system-ui'
  }
}}%%
mindmap
  root((Technology Map))
    Frontend
      Svelte 4
      Vite 5
      TypeScript
      Vitest
    Backend
      Node.js 20
      Express
      TypeScript
      Jest
      Opossum Circuit Breaker
    Data
      MongoDB 7
      Redis 7
    AI
      OpenRouter
      Model: GPT-4o-mini
      Fallback: Groq optional
    Ops
      Docker Compose
      Nginx
      Winston + Rotation
      Backups: backup.sh / restore.sh
```
Key notes:
- Frontend talks to backend via Vite proxy in dev, Nginx in prod.
- Sessions stored in MongoDB; caching layered via Redis.
- AI provider via OpenRouter (with optional fallback providers if configured).

Technologies (bullet list):
- Svelte 4 — reactive, compile-time UI framework that compiles components to efficient JavaScript for fast, lightweight frontends.
- Vite 5 — lightning-fast dev server and build tool with HMR; optimized production builds and modern ES module tooling.
- TypeScript — static typing and rich IDE tooling that reduces runtime bugs and improves maintainability across frontend/backends.
- Vitest — fast, Vite-native test runner for frontend components and utilities; integrates well with Svelte.
- Node.js 20 — modern JavaScript runtime for the backend with improved performance, timers, and stable APIs.
- Express — minimal, flexible web framework used to implement REST APIs, middleware, and routing.
- Jest — backend unit/integration testing with mocks and snapshots to validate services and routes.
- Opossum Circuit Breaker — resilience library to prevent cascading failures when external services (Spotify/AI) degrade.
- MongoDB 7 — document database used for session storage and persistent user state.
- Redis 7 — in-memory cache and rate-limit store; reduces redundant Spotify calls by 60–80% and smooths throughput.
- OpenRouter — AI gateway that routes requests to compatible models/providers with unified API semantics.
- Model: GPT-4o-mini — cost-effective, fast model for playlist text generation; balances quality and latency for UX.
- Fallback: Groq (optional) — alternative AI provider to maintain availability when the primary provider fails.
- Docker Compose — orchestrates multi-service dev/prod environments (backend, frontend, Redis, MongoDB) with health checks.
- Nginx — reverse proxy for TLS, static assets, and routing to backend; production entry point.
- Winston with rotation — structured JSON logging with daily rotation; separate error/combined/api logs.
- Backups: backup.sh / restore.sh — automated backup and restore scripts for operational safety and disaster recovery.

---

## OAuth 2.0 Login Flow (Sequence)

```mermaid
%%{init: {'theme': 'dark','themeVariables': {'background': '#0f1419','primaryTextColor': '#ffffff','lineColor': '#ffd700'}}}%%
sequenceDiagram
  participant U as User
  participant F as Frontend (Svelte)
  participant B as Backend (Express)
  participant S as Spotify OAuth

  U->>F: Click "Login with Spotify"
  F->>B: GET /auth/login
  B->>S: Initiate OAuth (client_id, redirect_uri, scopes)
  S-->>U: Consent + Redirect back to /auth/callback
  U->>B: GET /auth/callback?code=...
  B->>S: Exchange code for tokens
  S-->>B: Access + Refresh tokens
  B->>M: Store session (user profile)
  B-->>F: 200 + user session
  F-->>U: Show authenticated UI (Header + Uploader)
```

---

## Playlist Upload Flow (Batch Search + Add)

```mermaid
%%{init: {'theme': 'dark','themeVariables': {'background': '#0f1419','primaryTextColor': '#ffffff','lineColor': '#ffd700'}}}%%
sequenceDiagram
  participant U as User
  participant F as Frontend
  participant B as Backend
  participant R as Redis
  participant S as Spotify API

  U->>F: Paste text / Upload CSV
  F->>B: POST /api/search/batch (songs[])
  B->>R: Check cache for song matches
  alt Cache hit
    R-->>B: Return cached matches
  else Cache miss
    B->>S: Search tracks (rate-limited + circuit breaker)
    S-->>B: Track candidates
    B->>R: Cache bestMatch + alternatives
  end
  B-->>F: Compact results + confidence
  U->>F: Select tracks + target playlist
  F->>B: POST /api/playlists/:id/add (uris[])
  B->>S: Add tracks to playlist
  S-->>B: Success
  B-->>F: 200 OK
```

Highlights:
- Redis significantly lowers repeated search cost.
- Circuit breaker prevents cascading Spotify API failures.

---

## AI Playlist Generation Flow (with Rate Limiting)

```mermaid
%%{init: {'theme': 'dark','themeVariables': {'background': '#0f1419','primaryTextColor': '#ffffff','lineColor': '#ffd700'}}}%%
sequenceDiagram
  participant U as User
  participant F as Frontend
  participant B as Backend
  participant AI as OpenRouter
  participant R as Redis

  U->>F: Describe mood ("jeg vil høre abba")
  F->>B: POST /api/ai/generate
  B->>R: Check rate limits (per-user/day, per-ip/hour)
  alt Allowed
    B->>AI: Create completions with model
    alt 200 OK
      AI-->>B: Track list (titles + artists)
      B-->>F: Suggested songs + name
    else 401/429/5xx
      B-->>F: "AI service temporarily unavailable"
    end
  else Rate-limited
    B-->>F: Error (limit exceeded)
  end
```

Notes:
- Set env `OPENROUTER_API_KEY` to a valid key to avoid 401 Unauthorized.
- Fallback provider can be enabled via `AI_FALLBACK_PROVIDER`.

---

## Deployment & Networking (Dev/Prod)

```mermaid
%%{init: {'theme': 'dark','themeVariables': {'background': '#0f1419','primaryTextColor': '#ffffff','lineColor': '#ffd700'}}}%%
flowchart LR
  subgraph Dev[Docker Compose - Development]
    F[Frontend:5173]
    B[Backend:3000]
    R[Redis:6379]
    M[MongoDB:27017]
  end

  subgraph Prod[Docker Compose + Nginx - Production]
    N[Nginx:80/443]
    FE[Frontend built assets]
    BE[Backend:3000]
    RED[Redis]
    MON[MongoDB]
  end

  U((Users)) -->|TLS| N
  N --> FE
  FE --> BE
  BE --> RED
  BE --> MON
```

Health checks & ops:
- MongoDB health: `mongosh ... ping` in compose.
- Redis health: `redis-cli ping`.
- Automated backups via `backup.sh` and `restore.sh` folders under `backups/`.

---

## Caching & Resilience Components

```mermaid
%%{init: {'theme': 'dark','themeVariables': {'background': '#0f1419','primaryTextColor': '#ffffff','lineColor': '#ffd700'}}}%%
flowchart TD
  B[Backend] --> CB[Circuit Breaker]
  B --> RL[Rate Limiter]
  B --> RC[Redis Cache]

  CB --> SP[Spotify API]
  RL --> AI[OpenRouter]
  RC --> SP

  classDef default fill:#1a2028,stroke:#ffd700,color:#ffffff;
```

- Circuit breaker protects against repeated external API failures.
- Rate limiter enforces `AI_RATE_LIMIT_PER_USER_DAILY` & `AI_RATE_LIMIT_PER_IP_HOURLY`.
- Redis keys: `profile:{userId}`, `playlists:user:{userId}:{limit}`.

---

## Observability (Logging)

```mermaid
%%{init: {'theme': 'dark','themeVariables': {'background': '#0f1419','primaryTextColor': '#ffffff','lineColor': '#ffd700'}}}%%
flowchart LR
  B[Backend] --> W[Winston Logger]
  W --> E[error.log]
  W --> C[combined.log]
  W --> A[api.log]

  subgraph Rotation
    D[Daily Rotate File]
  end

  E --> D
  C --> D
  A --> D
```

- Structured JSON logs with contextual metadata (`service`, `userId`, `key`).
- Separate files: `error.log`, `combined.log`, `api.log` with rotation.

---

## Security Boundaries

```mermaid
%%{init: {'theme': 'dark','themeVariables': {'background': '#0f1419','primaryTextColor': '#ffffff','lineColor': '#ffd700'}}}%%
flowchart TD
  U[User] --> F[Frontend]
  F -->|CORS| B[Backend]
  B -->|Session Store| M[(MongoDB)]
  B -->|Restricted External Calls| SP[Spotify]
  B -->|Restricted External Calls| AI[OpenRouter]

  classDef default fill:#1a2028,stroke:#ffd700,color:#ffffff;
```

- CORS: `FRONTEND_URL` and `CORS_ORIGIN` enforced in backend.
- Session management: `SESSION_SECRET`, secure cookies.
- Least privilege Spotify scopes.

---

## Types & Interfaces (Simplified)

```mermaid
%%{init: {'theme': 'dark','themeVariables': {'background': '#0f1419','primaryTextColor': '#ffffff','lineColor': '#ffd700'}}}%%
classDiagram
  class UserResponse {
    +id string
    +display_name string
    +email string
    +images Image[]
  }
  class SpotifyPlaylist {
    +id string
    +name string
    +uri string
  }
  class SpotifyTrack {
    +id string
    +uri string
    +name string
    +artists Artist[]
    +album Album
    +duration_ms number
    +preview_url string
  }
  class Artist { +name string }
  class Album { +name string +images Image[] }
  class Image { +url string +height number +width number }
```

---

## Environment & Configuration

Key environment variables (see `.env.example`):
- `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `SPOTIFY_REDIRECT_URI`
- `FRONTEND_URL`, `CORS_ORIGIN`
- `MONGO_URI`, `REDIS_URL`
- `AI_PROVIDER`, `OPENROUTER_API_KEY`, `OPENROUTER_MODEL`
- `AI_RATE_LIMIT_PER_USER_DAILY`, `AI_RATE_LIMIT_PER_IP_HOURLY`

---

## Backup & Restore

- `backup.sh` and `restore.sh` manage automated backups to `backups/` with timestamped directories.
- Retention configurable via env (see docs) and cron/planned scripts.

---

## Notes

- For local AI generation, ensure `OPENROUTER_API_KEY` is valid; otherwise UI will show "AI service temporarily unavailable".
- Docker dev uses `Dockerfile.dev` for hot-reload (`volumes: ./backend/src:/app/src`).
