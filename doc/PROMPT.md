# Create a Christmas-themed Spotify Playlist Uploader Web Application

Build a full-stack web application that allows users to upload text-based playlists to Spotify with the following requirements:

## Core Functionality
- Accept text input where each line contains a single song/tune (format: "Artist - Song Title" or just "Song Title")
- Integrate with Spotify Web API to:
  - Authenticate users via OAuth 2.0
  - Search for each song and select the best match
  - Add matched tracks to a user-specified Spotify playlist
- Display search results with confidence indicators for each match
- Allow users to review and confirm matches before adding to playlist
- Show progress during upload (e.g., "Processing 5/20 songs...")

## Frontend Requirements
- **Christmas Theme**: Festive design with:
  - Holiday color scheme (reds, greens, golds, whites)
  - Subtle snowfall animation or holiday decorations
  - Christmas-inspired fonts and icons
  - Responsive, modern UI that works on mobile and desktop
- Clean, intuitive interface with drag-and-drop or paste support
- Real-time feedback on song matching quality
- Error handling for songs that can't be found

## Backend Requirements
- RESTful API or GraphQL endpoint for playlist processing
- Spotify API integration for authentication and playlist management
- Rate limiting and error handling for API calls
- Session management for authenticated users
- Logging for debugging and monitoring

## Technology Stack (Suggested)
- **Frontend**: React/Vue/Svelte with a modern UI library
- **Backend**: Node.js (Express) or Python (FastAPI/Flask)
- **Database**: PostgreSQL or MongoDB for user sessions (optional)
- **Authentication**: Spotify OAuth 2.0

## Docker Compose Deployment
- Multi-container setup with:
  - Frontend container (Nginx serving static files)
  - Backend API container
  - Optional: Database container if needed
  - Optional: Redis for session management
- Environment variables for Spotify API credentials
- Docker volumes for persistent data
- Proper networking between containers
- Health checks for all services
- Production-ready configuration with restart policies

## Security & Best Practices
- Secure storage of Spotify API credentials (use environment variables)
- HTTPS support (nginx with SSL certificates)
- Input validation and sanitization
- Rate limiting to prevent abuse
- Proper error messages without exposing sensitive information

## Deliverables
1. Complete source code with clear folder structure
2. `docker-compose.yml` for easy deployment
3. `Dockerfile` for each service
4. `.env.example` file with required environment variables
5. README.md with:
   - Setup instructions
   - How to get Spotify API credentials
   - How to run locally and deploy with Docker
   - Usage examples

## Bonus Features (Optional)
- Preview matched songs with Spotify embeds
- Batch playlist creation from multiple files
- Export/download playlist as text file
- Playlist editing capabilities
- Dark/light mode toggle (keeping Christmas theme)
- Analytics showing which songs couldn't be matched
