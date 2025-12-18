# 🎵 Listify

A modern web application that converts text-based playlists into Spotify playlists with AI-powered playlist generation! Simply paste your song list, and the app will search Spotify, match the songs, and add them to your playlist.

![Christmas Theme](https://img.shields.io/badge/Theme-Christmas-red?style=for-the-badge)
![Docker](https://img.shields.io/badge/Docker-Ready-blue?style=for-the-badge&logo=docker)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

## ✨ Features

### User Features
- 🎅 **Beautiful Christmas Theme** - Festive UI with snowfall animations and twinkling lights
- 🤖 **AI Playlist Generator** - Describe your playlist in natural language, AI creates it for you
- 🎵 **Smart Song Matching** - Intelligent search with confidence scoring
- 📝 **Multiple Input Methods** - Text input, AI generation, or CSV file upload (Shazam compatible)
- 📄 **CSV Import** - Import playlists from Shazam or other music services
- ✅ **Match Verification** - Review and select/deselect songs before adding
- 🎯 **Confidence Scores** - See how well each song matched your query
- 🔄 **Alternative Selection** - Choose from alternative matches for each song
- ➕ **Playlist Management** - Add to existing playlists or create new ones
- 📊 **Progress Tracking** - Visual feedback during upload
- 🔐 **Secure OAuth** - Spotify authentication via OAuth 2.0
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile

### Production Reliability (Phases 9-12)
- 🛡️ **Request Timeouts** - 5-second timeout on all API calls prevents hanging requests
- 🔄 **Automatic Retries** - Up to 3 retries with exponential backoff for transient errors
- ⚡ **Circuit Breaker** - Prevents cascading failures when Spotify API is down
- 🏥 **Self-Healing** - Auto-recovery after 30 seconds when API becomes healthy
- 📊 **Graceful Degradation** - Returns empty results instead of errors when circuit is open
- 💾 **Redis Caching** - 60-80% reduction in Spotify API calls with intelligent caching
- ⚡ **Lightning Fast** - Cached responses return in <10ms for repeated queries
- 🚀 **Production Ready** - Optimized Docker deployment with enterprise-grade resilience

## 🛠 Tech Stack

### Frontend
- **Svelte 4.2** - Modern reactive framework
- **TypeScript 5.3** - Type-safe JavaScript
- **Vite 5.0** - Lightning-fast build tool
- **Axios** - HTTP client
- **Google Fonts** - Mountains of Christmas & Poppins

### Backend
- **Node.js 20** - JavaScript runtime
- **TypeScript 5.3** - Type-safe JavaScript
- **Express.js** - Web framework
- **MongoDB 7** - Database for sessions
- **Redis 7** - Caching layer for Spotify API responses
- **Spotify Web API** - Music data and playlist management
- **Resilience Patterns** - Circuit breaker (opossum), retry logic (axios-retry), timeouts

### DevOps
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **Nginx** - Production web server

## 📋 Prerequisites

- Docker Desktop (or Docker Engine + Docker Compose)
- Spotify Developer Account (free)
- Modern web browser

## 🎯 Quick Start

### 1. Get Spotify API Credentials

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Log in with your Spotify account
3. Click "Create App"
4. Fill in the details:
   - **App Name**: Listify
   - **App Description**: Upload text playlists to Spotify
   - **Redirect URI**: `http://127.0.0.1:80/auth/callback`
5. Accept the terms and click "Create"
6. Copy your **Client ID** and **Client Secret**
7. Add your Spotify account email to the app's User Management section (required for Development Mode apps)

### 2. Clone and Configure

```bash
# Clone the repository
git clone <your-repo-url>
cd spotifyuploader

# Copy environment template
cp .env.example .env

# Edit .env with your credentials
# Required: SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SESSION_SECRET
```

### 3. Generate Session Secret

```bash
# Generate a secure session secret
openssl rand -base64 32

# Add it to your .env file as SESSION_SECRET
```

### 4. Run the Application

**Production Mode** (Recommended):
```bash
docker-compose -f docker-compose.prod.yml up -d
```

**Development Mode**:
```bash
docker-compose up -d
```

### 5. Access the Application

- **Production**: http://localhost
- **Development**: http://localhost:5173

## 🎮 Usage

### AI Playlist Generator Method (NEW!)

1. **Login**: Click "Login with Spotify" and authorize the application
2. **Open AI Generator**: Click the "Generate Playlist with AI" button (🤖 icon)
3. **Describe Your Playlist**: Enter a natural language description:
   - "Upbeat 80s rock songs for a road trip"
   - "Calm acoustic music for studying"
   - "High-energy workout playlist with EDM and hip-hop"
   - "Best of 90s alternative rock"
4. **Choose Length**: Select either:
   - **Number of Songs**: 5-50 songs (default: 20)
   - **Duration**: 15-180 minutes (default: 60 minutes)
5. **Generate**: Click "✨ Generate Playlist" and wait 3-5 seconds
6. **Review**: The AI-generated playlist automatically populates the text input
7. **Edit** (Optional): Modify the generated playlist if needed
8. **Search**: Click "Search Songs" to find matches on Spotify
9. **Upload**: Add to your Spotify playlist

**Rate Limits**: 1000 generations per day per user (configurable)

### Text Input Method

1. **Login**: Click "Login with Spotify" and authorize the application
2. **Select Text Input**: Click the "📝 Text Input" tab
3. **Paste Playlist**: Enter your songs, one per line:
   ```
   Mariah Carey - All I Want for Christmas Is You
   Wham! - Last Christmas
   The Pogues - Fairytale of New York
   ```
4. **Search**: Click "Search Songs" to find matches
5. **Review & Customize**:
   - Check confidence scores for each match
   - Select alternative matches using radio buttons if needed
   - Uncheck "Include" to exclude songs from upload
   - The "Selected" counter shows how many songs will be added
6. **Choose Playlist**: Select an existing playlist or create a new one
7. **Upload**: Click "Add to Playlist" to upload selected songs
8. **Enjoy**: Your playlist is now on Spotify!

### CSV Import Method (Shazam Compatible)

1. **Login**: Click "Login with Spotify" and authorize the application
2. **Select CSV Upload**: Click the "📄 Upload CSV" tab
3. **Prepare CSV File**: Export your music from Shazam or create a CSV file with these columns:
   - **Title** (or "Song" or "Track")
   - **Artist** (or "ArtistName")
   - Additional columns are ignored
4. **Upload File**: Click the upload area and select your CSV file
5. **Preview**: Review the parsed songs in the preview area
6. **Search**: Click "Search Songs" to find matches on Spotify
7. **Review & Customize**: Same as text input method
8. **Upload**: Add to your Spotify playlist

#### Shazam Export Instructions

To export your Shazam library:
1. Open the Shazam app on your device
2. Go to "My Music" or "Library"
3. Tap the settings (⚙️) or more options (•••) button
4. Select "Export Shazams" or "Share Library"
5. Choose "CSV" as the export format
6. Save the CSV file to your device
7. Upload it using the CSV tab in this application

#### Shazam CSV Format Example

The Shazam export includes a title line followed by CSV data:

```csv
Shazam Library
Index,TagTime,Title,Artist,URL,TrackKey
1,2024-12-14,"All I Want for Christmas Is You","Mariah Carey",https://www.shazam.com/track/5123456/all-i-want-for-christmas-is-you,5123456
2,2024-12-14,"Last Christmas","Wham!",https://www.shazam.com/track/5123457/last-christmas,5123457
3,2024-12-14,"Fairytale of New York","The Pogues",https://www.shazam.com/track/5123458/fairytale-of-new-york,5123458
```

#### Generic CSV Format

You can also upload any CSV file with these columns:

```csv
Title,Artist
"Song Name","Artist Name"
"Another Song","Another Artist"
```

**Note**: The CSV parser supports:
- Shazam export format (with "Shazam Library" title line)
- Generic CSV files with Title and Artist columns
- Quoted values with commas and special characters
- Case-insensitive column matching
- Multiple column name variations:
  - Title columns: "Title", "Song", or "Track"
  - Artist columns: "Artist" or "ArtistName"
- Files with additional columns (Index, TagTime, URL, etc. are ignored)

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the project root:

```env
# Spotify API Credentials (REQUIRED)
SPOTIFY_CLIENT_ID=your_client_id_here
SPOTIFY_CLIENT_SECRET=your_client_secret_here
SPOTIFY_REDIRECT_URI=http://localhost:3000/auth/callback

# Session Security (REQUIRED)
SESSION_SECRET=generate_with_openssl_rand_base64_32

# Application URLs
FRONTEND_URL=http://localhost:5173
CORS_ORIGIN=http://localhost:5173

# Production Settings
PORT=80
NODE_ENV=production

# Redis Cache Configuration
REDIS_URL=redis://redis:6379
CACHE_ENABLED=true

# AI Playlist Generator Configuration
AI_PROVIDER=openrouter
OPENROUTER_API_KEY=your_openrouter_api_key_here
OPENROUTER_MODEL=openai/gpt-3.5-turbo
AI_RATE_LIMIT_PER_USER_DAILY=1000
AI_RATE_LIMIT_PER_IP_HOURLY=500
```

### Spotify Redirect URIs

Add these to your Spotify App settings:
- **Local Testing**: `http://127.0.0.1:80/auth/callback` (Note: Spotify requires 127.0.0.1 and explicit port for HTTP)
- **Production**: `https://yourdomain.com/auth/callback`

**Important**: Spotify's OAuth requires the redirect URI to match exactly. For local development, use `127.0.0.1` (not `localhost`) with the explicit port number `:80`.

## 📁 Project Structure

```
spotifyuploader/
├── backend/                    # Node.js/Express API (TypeScript)
│   ├── src/
│   │   ├── cache/             # Redis connection module
│   │   ├── config/            # Configuration
│   │   ├── db/                # MongoDB connection
│   │   ├── middleware/        # Rate limiting, caching, etc.
│   │   ├── routes/            # API routes
│   │   ├── services/          # Spotify API wrapper
│   │   ├── types/             # TypeScript type definitions
│   │   ├── utils/             # Logger, cache utilities
│   │   └── server.ts          # Entry point
│   ├── dist/                  # Compiled JavaScript (gitignored)
│   ├── logs/                  # Application logs (gitignored)
│   ├── tsconfig.json          # TypeScript configuration
│   ├── Dockerfile             # Production build (multi-stage)
│   └── package.json
├── frontend/                   # Svelte application (TypeScript)
│   ├── src/
│   │   ├── components/        # Svelte components (TypeScript)
│   │   ├── lib/               # API client (TypeScript)
│   │   ├── types/             # TypeScript type definitions
│   │   ├── App.svelte         # Root component
│   │   ├── main.ts            # Entry point
│   │   └── app.css            # Global styles
│   ├── tsconfig.json          # TypeScript configuration
│   ├── Dockerfile             # Production build (multi-stage)
│   ├── Dockerfile.dev         # Development build
│   ├── nginx.conf             # Nginx configuration
│   └── package.json
├── backups/                    # Database backups directory
│   └── .gitkeep               # Ensures directory exists
├── docker-compose.yml          # Development setup
├── docker-compose.prod.yml     # Production setup
├── docker-compose.test.yml     # Test containers setup
├── run-tests.sh                # Test runner script
├── backup.sh                   # Manual backup script
├── restore.sh                  # Database restore script
├── .env.example               # Environment template
├── .gitignore
├── PROMPT.md                  # Original requirements
├── PLAN.md                    # Implementation plan
├── PHASE1.md                  # Phase 1 documentation
├── PHASE2.md                  # Phase 2 documentation
├── PHASE3.md                  # Phase 3 documentation
├── PHASE4.md                  # Phase 4 documentation
├── PHASE5.md                  # Phase 5 documentation
├── PHASE6.md                  # Phase 6 documentation
├── PHASE7.md                  # Phase 7 documentation
├── PHASE8.md                  # Phase 8 documentation (Automated Testing)
├── PHASE9.md                  # Phase 9 documentation (Timeouts & Circuit Breaker)
├── PHASE10.md                 # Phase 10 documentation (Database Backup Strategy)
├── PHASE11.md                 # Phase 11 documentation (Structured Logging)
├── PHASE12.md                 # Phase 12 documentation (Redis Caching Layer)
├── PHASE13.md                 # Phase 13 documentation (TypeScript Migration)
├── ANALYZIS.md                # Application analysis and improvement recommendations
├── TESTING.md                 # Testing guide and documentation
├── test-shazam-export.csv     # Sample Shazam CSV for testing
└── README.md                  # This file
```

## 🏗 Architecture

### Development Mode
```
┌─────────────────────────────────────────┐
│         Docker Network                   │
│                                          │
│  ┌────────────┐    ┌────────────┐       │
│  │  MongoDB   │    │   Redis    │       │
│  │   :27017   │    │   :6379    │       │
│  └────────────┘    └────────────┘       │
│         ▲               ▲                │
│         │               │                │
│  ┌──────┴───────────────┴──┐            │
│  │  Backend :3000          │            │
│  └────────────┘                         │
│         ▲                                │
│         │ (Vite Proxy)                  │
│  ┌──────┴───────┐                       │
│  │  Frontend    │                       │
│  │  Vite :5173  │                       │
│  └──────────────┘                       │
└─────────────────────────────────────────┘
```

### Production Mode
```
┌─────────────────────────────────────────┐
│         Docker Network                   │
│                                          │
│  ┌────────────┐    ┌────────────┐       │
│  │  MongoDB   │    │   Redis    │       │
│  │ (Internal) │    │ (Internal) │       │
│  └────────────┘    └────────────┘       │
│         ▲               ▲                │
│         │               │                │
│  ┌──────┴───────────────┴──┐            │
│  │  Backend (Internal)     │            │
│  └─────────────────────────┘            │
│         ▲                                │
│         │ (Reverse Proxy)               │
│  ┌──────┴───────┐                       │
│  │    Nginx     │                       │
│  │   Port 80    │                       │
│  └──────────────┘                       │
└──────────┬──────────────────────────────┘
           │
           ▼
      [Internet]
```

## 🔌 API Documentation

### Authentication Endpoints

#### GET /auth/login
Initiates Spotify OAuth flow.

**Response:**
```json
{
  "authUrl": "https://accounts.spotify.com/authorize?..."
}
```

#### GET /auth/callback
Handles OAuth callback from Spotify.

#### GET /auth/me
Returns current user information.

**Response:**
```json
{
  "id": "user_id",
  "displayName": "User Name",
  "email": "user@example.com",
  "images": [...],
  "product": "premium"
}
```

#### POST /auth/logout
Logs out the current user.

### Playlist Endpoints

#### POST /api/search
Search for a single track.

**Request:**
```json
{
  "query": "Artist - Song Name"
}
```

**Response:**
```json
{
  "results": [
    {
      "id": "track_id",
      "uri": "spotify:track:...",
      "name": "Song Name",
      "artists": ["Artist"],
      "album": "Album Name",
      "albumImage": "https://...",
      "popularity": 85
    }
  ]
}
```

#### POST /api/search/batch
Search for multiple tracks (max 100).

**Request:**
```json
{
  "queries": ["Song 1", "Song 2", ...]
}
```

**Response:**
```json
{
  "results": [
    {
      "query": "Song 1",
      "success": true,
      "bestMatch": {
        "id": "track_id",
        "uri": "spotify:track:...",
        "confidence": 95,
        ...
      },
      "alternatives": [...]
    }
  ]
}
```

#### GET /api/playlists
Get all user playlists.

#### POST /api/playlists
Create a new playlist.

**Request:**
```json
{
  "name": "My Playlist",
  "description": "Description",
  "isPublic": true
}
```

#### POST /api/playlists/:playlistId/tracks
Add tracks to a playlist.

**Request:**
```json
{
  "trackUris": ["spotify:track:...", ...]
}
```

## 🚀 Deployment

### Production Deployment

1. **Set Environment Variables**:
   ```bash
   cp .env.example .env
   # Edit .env with production values
   ```

2. **Update Redirect URI**:
   - In Spotify Dashboard, add: `https://yourdomain.com/auth/callback`
   - In `.env`: `SPOTIFY_REDIRECT_URI=https://yourdomain.com/auth/callback`

3. **Build and Run**:
   ```bash
   docker-compose -f docker-compose.prod.yml build
   docker-compose -f docker-compose.prod.yml up -d
   ```

4. **Verify**:
   ```bash
   docker-compose -f docker-compose.prod.yml ps
   curl http://localhost/health
   ```

### Updating the Application

```bash
# Pull latest changes
git pull

# Rebuild and restart
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d
```

### Viewing Logs

```bash
# All services
docker-compose -f docker-compose.prod.yml logs -f

# Specific service
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f frontend

# Backup service logs
docker-compose -f docker-compose.prod.yml logs -f mongodb-backup
```

## 💾 Database Backup & Restore

### Automated Backups (Production)

The production deployment includes automated daily backups:
- **Frequency**: Every 24 hours
- **Retention**: 7 days (configurable via `BACKUP_RETENTION_DAYS` in `.env`)
- **Location**: `./backups/` directory
- **Automatic cleanup**: Backups older than retention period are deleted

**View backup logs:**
```bash
docker logs -f spotify-uploader-backup-prod
```

**Expected output:**
```
🎄 MongoDB Backup Service Started
Database: spotify-uploader
Backup Interval: Daily (every 24 hours)
Retention: 7 days

[2025-12-15 00:00:00] Starting backup...
[2025-12-15 00:00:01] ✅ Backup completed: /backups/backup-20251215-000000 (8.0K)
[2025-12-15 00:00:01] Backups remaining: 7
[2025-12-15 00:00:01] Next backup in 24 hours...
```

### Manual Backup

Create a backup anytime:

```bash
./backup.sh
```

This will:
- Create a timestamped backup in `backups/manual-backup-YYYYMMDD-HHMMSS/`
- Display backup size and collections
- Show restore instructions

### Restore from Backup

**List available backups:**
```bash
./restore.sh
```

**Restore a specific backup:**
```bash
./restore.sh backups/backup-20251215-120000
```

**The restore process will:**
1. Show backup details (size, collections)
2. Warn that current data will be overwritten
3. Ask for confirmation
4. Restore the database
5. Provide next steps (restart backend)

**After restore:**
```bash
# Restart the backend to use restored data
docker-compose -f docker-compose.prod.yml restart backend
```

### Backup Configuration

Edit `.env` to configure backup retention:

```bash
# Number of days to keep backups (default: 7)
BACKUP_RETENTION_DAYS=30  # Keep 30 days
```

### Backup Directory Structure

```
backups/
├── backup-20251215-000000/       # Automated daily backup
├── backup-20251216-000000/       # Next day's backup
└── manual-backup-20251215-073312/ # Manual backup
```

**Note:** Backups are excluded from git (see `.gitignore`)

## 📝 Application Logs

### Structured Logging (Phase 11)

The application uses Winston for structured JSON logging with automatic rotation and compression.

**Log Levels:**
- `error` - Errors only
- `warn` - Warnings + errors
- `info` - Info + warnings + errors (default)
- `http` - HTTP requests + above
- `debug` - All logs including debug info

**Log Files:**
- `backend/logs/error-YYYY-MM-DD.log` - Errors only (14 day retention)
- `backend/logs/combined-YYYY-MM-DD.log` - All logs (7 day retention)
- `backend/logs/http-YYYY-MM-DD.log` - HTTP requests (7 day retention)

**Features:**
- Daily rotation at midnight
- Automatic gzip compression
- Configurable retention periods
- JSON format for easy querying

### Viewing Application Logs

**Real-time monitoring:**
```bash
# Follow combined log (all levels)
tail -f backend/logs/combined-2025-12-15.log

# Follow error log (errors only)
tail -f backend/logs/error-2025-12-15.log

# Follow HTTP requests
tail -f backend/logs/http-2025-12-15.log
```

**Search and filter logs:**
```bash
# Find all errors
jq 'select(.level == "error")' backend/logs/combined-2025-12-15.log

# Find errors for specific context
jq 'select(.metadata.context == "Search track")' backend/logs/error-2025-12-15.log

# Find circuit breaker events
jq 'select(.message == "Circuit Breaker State Change")' backend/logs/combined-2025-12-15.log

# Count errors by type
jq -r '.error.name' backend/logs/error-2025-12-15.log | sort | uniq -c
```

### Configure Log Level

Edit `.env` to set the desired log level:

```bash
# Production (minimal logging)
LOG_LEVEL=info

# Development (verbose logging)
LOG_LEVEL=debug

# Only errors
LOG_LEVEL=error
```

### Log Rotation and Cleanup

**Automatic:**
- Logs rotate daily at midnight
- Old logs compressed with gzip (~70% size reduction)
- Logs older than retention period automatically deleted

**Manual cleanup:**
```bash
# Remove all logs older than 7 days
find backend/logs -name "*.log*" -mtime +7 -delete

# Remove compressed logs only
rm backend/logs/*.gz
```

### Example Log Entries

**Successful Request:**
```json
{
  "timestamp": "2025-12-15 07:30:00",
  "level": "info",
  "message": "Server started successfully",
  "service": "spotify-uploader-backend",
  "metadata": {
    "port": 3000,
    "environment": "production"
  }
}
```

**Error with Context:**
```json
{
  "timestamp": "2025-12-15 07:30:15",
  "level": "error",
  "message": "Database connection failed",
  "error": {
    "name": "MongoError",
    "message": "Connection timeout",
    "stack": "Error: Connection timeout..."
  },
  "metadata": {
    "context": "Search track",
    "userId": "user123"
  }
}
```

## 🐛 Troubleshooting

### "Not authenticated" error
- Check that Spotify credentials are set correctly in `.env`
- Verify redirect URI matches in both Spotify Dashboard and `.env`
- Clear browser cookies and try logging in again

### Songs not matching
- Use format: "Artist - Song Title" for best results
- Check spelling of artist and song names
- Try simpler queries (just song title)

### Rate limit errors
- Wait 15 minutes before retrying
- Batch operations are limited to 10/minute
- Single searches are limited to 50/minute

### Docker issues
```bash
# Reset everything
docker-compose -f docker-compose.prod.yml down -v
docker-compose -f docker-compose.prod.yml up -d

# Check container logs
docker-compose -f docker-compose.prod.yml logs
```

### Port already in use
```bash
# Change PORT in .env (production)
PORT=8080

# Or for development, stop conflicting services
lsof -ti:80 | xargs kill
```

## ⚠️ Known Limitations

### Spotify Development Mode Restrictions

**Preview URLs Not Available**: The Spotify API does not provide audio preview URLs for apps in Development Mode (apps with fewer than 25 users). This affects:
- The preview player feature is implemented in the code but disabled in the UI
- All `preview_url` fields return `null` from Spotify's API
- This limitation exists even for very popular songs

**To enable preview functionality:**
1. Apply for [Spotify Extended Quota Mode](https://developer.spotify.com/documentation/web-api/guides/quota-modes/)
2. Get approval from Spotify (requires review)
3. Uncomment the preview player code in `frontend/src/components/SongResults.svelte`

**User Access Limitation**: Development Mode apps can only be used by up to 25 users who are explicitly added to the app's User Management section in the Spotify Developer Dashboard.

## 🧪 Testing

The application includes comprehensive automated testing for both backend and frontend. **All tests run in dedicated Docker containers** for consistent, isolated test environments.

### Running Tests

**Quick Start** (Recommended):
```bash
# From project root
./run-tests.sh                # Run all tests
./run-tests.sh --coverage     # Run with coverage reports
./run-tests.sh --backend      # Backend tests only
./run-tests.sh --frontend     # Frontend tests only
./run-tests.sh --help         # Show all options
```

Coverage reports are generated in:
- `backend/coverage/index.html`
- `frontend/coverage/index.html`

**Test Coverage Goals**: 60%+ for branches, functions, lines, and statements

**Benefits of Container-Based Testing**:
- ✅ Isolated test environment (doesn't affect local machine)
- ✅ Consistent Node.js version and dependencies
- ✅ No local installation required
- ✅ Automatic cleanup after tests
- ✅ CI/CD ready

For detailed testing documentation, see [TESTING.md](TESTING.md).

### Test Production Build Locally
```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Start services
docker-compose -f docker-compose.prod.yml up -d

# Test endpoints
curl http://localhost/health
curl http://localhost/auth/login
```

### Test Development Setup
```bash
# Start development services
docker-compose up -d

# Access development server
open http://localhost:5173
```

## 📊 Performance

- **Bundle Size**: ~27 KB (gzipped)
- **Initial Load**: < 1 second
- **Asset Caching**: 1 year for static files
- **Compression**: Gzip enabled (60-80% reduction)
- **Redis Caching**: 60-80% fewer Spotify API calls
- **Cached Responses**: <10ms for repeated queries
- **Search TTL**: 1 hour for search results
- **Playlist TTL**: 15 minutes for user playlists

## 🔒 Security Features

- OAuth 2.0 authentication
- CSRF protection with state parameter
- HTTP-only secure cookies
- Rate limiting per IP
- Session expiration
- Security headers (X-Frame-Options, X-XSS-Protection, etc.)
- Network isolation in production
- No exposed database ports

## 🎨 Customization

### Change Theme Colors
Edit `frontend/src/app.css`:
```css
:root {
  --christmas-red: #c41e3a;
  --christmas-green: #165b33;
  --christmas-gold: #ffd700;
}
```

### Modify Rate Limits
Edit `backend/src/middleware/rateLimiter.js`:
```javascript
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100, // Change this value
});
```

## 📝 Development

### Prerequisites
- Node.js 20+
- Docker Desktop
- Git

### Setup Development Environment
```bash
# Install dependencies locally (optional, for IDE support)
cd backend && npm install
cd ../frontend && npm install

# Start development containers
docker-compose up -d

# View logs
docker-compose logs -f
```

### Hot Reload
Both frontend and backend support hot reload in development mode:
- Frontend: Vite HMR (instant updates)
- Backend: Node.js --watch (restarts on changes)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- [Spotify Web API](https://developer.spotify.com/documentation/web-api)
- [Svelte](https://svelte.dev)
- [Vite](https://vitejs.dev)
- [Express.js](https://expressjs.com)
- [MongoDB](https://www.mongodb.com)

## 📚 Documentation

Comprehensive documentation is available in the `doc/` directory:

- **[doc/PLAN.md](doc/PLAN.md)** - Complete implementation plan with all phases
- **[doc/ANALYZIS.md](doc/ANALYZIS.md)** - Code quality analysis (9.5/10 rating)
- **[doc/PLAN_OFT.md](doc/PLAN_OFT.md)** - Oracle Cloud Free Tier deployment guide
- **[doc/PHASE1-13.md](doc/)** - Detailed phase documentation (13 phases completed)
- **[doc/PHASE13.md](doc/PHASE13.md)** - TypeScript Migration documentation
- **[CLAUDE.md](CLAUDE.md)** - Developer guide for Claude Code

## 📞 Support

For issues and questions:
- Open an issue on GitHub
- Check the troubleshooting section above
- Review the comprehensive documentation in `doc/` directory
- See [doc/TESTING.md](doc/TESTING.md) for test-related questions

## 🎄 Happy Holidays!

Enjoy uploading your Christmas playlists! 🎅🎁🎉

---

**Made with ❤️ and a lot of festive spirit**
