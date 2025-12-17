# AI Playlist Generator Feature Plan

**Feature:** AI-Powered Playlist Generation with ChatGPT
**Application:** Christmas Spotify Playlist Uploader
**Date:** December 15, 2025
**Status:** ✅ IMPLEMENTED (December 17, 2025)

---

## Table of Contents
1. [Overview](#overview)
2. [User Stories](#user-stories)
3. [AI Service Options](#ai-service-options)
4. [ChatGPT Prompt Engineering](#chatgpt-prompt-engineering)
5. [Architecture & Flow](#architecture--flow)
6. [Technical Implementation](#technical-implementation)
7. [UI/UX Design](#uiux-design)
8. [Backend Implementation](#backend-implementation)
9. [Frontend Implementation](#frontend-implementation)
10. [Testing Strategy](#testing-strategy)
11. [Rate Limiting & Cost Control](#rate-limiting--cost-control)
12. [Security Considerations](#security-considerations)
13. [Deployment Steps](#deployment-steps)
14. [Future Enhancements](#future-enhancements)

---

## Overview

### Feature Description

Add an AI-powered playlist generator that allows users to describe the type of playlist they want, and ChatGPT generates a list of songs in "Artist - Title" format. The generated playlist automatically populates the existing text input field, ready for Spotify search and export.

### Key Capabilities

- 🤖 **AI Playlist Generation** - Describe your playlist in natural language
- 🎵 **Smart Song Selection** - AI suggests songs matching style, mood, era, genre
- 📊 **Flexible Length** - Specify number of songs OR playlist duration
- ✨ **Auto-Population** - Generated songs auto-fill the playlist input
- 🔄 **Seamless Integration** - Works with existing search & export flow
- 💰 **Cost-Effective** - Uses free/low-cost AI API tiers

### User Flow

```
1. User describes playlist (e.g., "90s rock workout playlist, 60 minutes")
2. User specifies length (number of songs OR duration in minutes)
3. Click "Generate Playlist with AI"
4. AI generates song list in "Artist - Title" format
5. Songs auto-populate the playlist text input field
6. User reviews, edits if needed
7. User clicks "Search Songs" (existing flow)
8. User exports to Spotify (existing flow)
```

---

## User Stories

### Primary User Stories

**Story 1: Generate by Style and Song Count**
```
As a user,
I want to describe a playlist style and specify how many songs I want,
So that I can quickly create a custom playlist without manual song selection.

Example: "Energetic EDM party music" + "30 songs"
```

**Story 2: Generate by Mood and Duration**
```
As a user,
I want to describe a playlist mood and specify duration in minutes,
So that I can create playlists for specific activities (workout, commute, etc.).

Example: "Relaxing jazz for studying" + "90 minutes"
```

**Story 3: Edit AI-Generated Playlist**
```
As a user,
I want to edit the AI-generated song list before searching,
So that I can add/remove/modify songs to match my exact preferences.
```

**Story 4: Re-generate Different Suggestions**
```
As a user,
I want to regenerate the playlist if I don't like the suggestions,
So that I can explore different song combinations for the same theme.
```

---

## AI Service Options

### Option 1: OpenRouter (RECOMMENDED)

**Pros:**
- ✅ Unified API for multiple LLM providers
- ✅ Free tier: 20 requests/minute, 200 requests/day
- ✅ Access to multiple models (GPT-3.5, Claude, Llama, etc.)
- ✅ Pay-as-you-go with competitive pricing
- ✅ No upfront costs, excellent for testing

**Cons:**
- ⚠️ Rate limits on free tier
- ⚠️ Requires API key signup

**Pricing:**
- Free tier: 200 requests/day
- GPT-3.5 Turbo: ~$0.0005 per request (average)
- Monthly cost for 1000 users: ~$15-30

**Implementation:**
```javascript
API Endpoint: https://openrouter.ai/api/v1/chat/completions
Models: openai/gpt-3.5-turbo, anthropic/claude-instant
```

### Option 2: Groq

**Pros:**
- ✅ Extremely fast inference (300+ tokens/second)
- ✅ Free tier: 1000 requests/day, 6000 tokens/minute
- ✅ Open-source models (Llama 3, Mixtral)
- ✅ No credit card required for free tier

**Cons:**
- ⚠️ Limited to open-source models
- ⚠️ May have less "creative" playlist suggestions than GPT-4

**Pricing:**
- Free tier: 1000 requests/day
- Paid tier: $0.10 - $0.27 per million tokens

**Implementation:**
```javascript
API Endpoint: https://api.groq.com/openai/v1/chat/completions
Models: llama3-70b-8192, mixtral-8x7b-32768
```

### Option 3: OpenAI GPT-3.5 Turbo (Direct)

**Pros:**
- ✅ Official OpenAI API
- ✅ Best quality for creative tasks
- ✅ Reliable uptime and support
- ✅ Well-documented

**Cons:**
- ⚠️ No free tier (pay-as-you-go only)
- ⚠️ Requires payment method
- ⚠️ $5-18 trial credits (limited)

**Pricing:**
- $0.0005 per 1K input tokens
- $0.0015 per 1K output tokens
- Average cost per playlist: $0.002-0.005
- Monthly cost for 1000 users: $20-50

**Implementation:**
```javascript
API Endpoint: https://api.openai.com/v1/chat/completions
Model: gpt-3.5-turbo
```

### Option 4: Google AI Studio (Gemini)

**Pros:**
- ✅ Very generous free tier: 1M tokens/minute, 1500 requests/day
- ✅ Gemini models competitive with GPT-3.5
- ✅ No credit card required initially
- ✅ Good for high-volume testing

**Cons:**
- ⚠️ Different API format
- ⚠️ Less community support than OpenAI

**Pricing:**
- Free tier: 1,500 requests/day
- Gemini 1.5 Flash: Free up to quota

**Implementation:**
```javascript
API Endpoint: https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent
```

### Recommendation

**For Production:** Use **OpenRouter** with fallback to **Groq**
- OpenRouter for quality (GPT-3.5 Turbo)
- Groq as fallback for speed and free tier
- Implement client-side rate limiting
- Add user quota (e.g., 5 AI generations per day per user)

---

## ChatGPT Prompt Engineering

### System Prompt (Prime the AI)

```javascript
const SYSTEM_PROMPT = `You are a music expert and playlist curator. Your task is to generate song playlists based on user descriptions.

RULES:
1. Output ONLY a list of songs, one per line
2. Format: "Artist - Song Title" (exactly this format)
3. Use real, popular songs that exist on Spotify
4. Match the user's requested style, mood, genre, and era
5. Ensure songs fit together cohesively
6. Prioritize well-known songs that are likely to be found on Spotify
7. Do NOT include:
   - Song explanations or descriptions
   - Numbering (1., 2., etc.)
   - Any additional text or commentary
   - Album names or years
8. If duration is specified, estimate ~3.5 minutes per song average
9. Provide diverse artists (avoid repeating same artist unless requested)
10. Consider the playlist flow and energy progression

OUTPUT FORMAT EXAMPLE:
Daft Punk - One More Time
The Chemical Brothers - Block Rockin' Beats
Fatboy Slim - Right Here, Right Now
Basement Jaxx - Where's Your Head At
`;
```

### User Prompt Templates

#### Template 1: By Number of Songs
```javascript
const USER_PROMPT_BY_COUNT = (description, songCount) => `
Generate a playlist with exactly ${songCount} songs.

Playlist description: ${description}

Output only the song list in "Artist - Title" format, one per line.
`;

// Example input:
// description: "Upbeat 80s pop for a road trip"
// songCount: 25

// Expected output:
// Michael Jackson - Beat It
// Cyndi Lauper - Girls Just Want to Have Fun
// Queen - Don't Stop Me Now
// ...
```

#### Template 2: By Duration
```javascript
const USER_PROMPT_BY_DURATION = (description, durationMinutes) => `
Generate a playlist that lasts approximately ${durationMinutes} minutes.
Assume average song length is 3.5 minutes.
Calculate the number of songs needed: approximately ${Math.round(durationMinutes / 3.5)} songs.

Playlist description: ${description}

Output only the song list in "Artist - Title" format, one per line.
`;

// Example input:
// description: "Chill lofi hip hop for studying"
// durationMinutes: 90

// Expected output (approx 26 songs):
// Nujabes - Feather
// J Dilla - Time: The Donut of the Heart
// Tomppabeats - You're Cute
// ...
```

#### Template 3: Advanced with Additional Filters
```javascript
const USER_PROMPT_ADVANCED = (description, songCount, options = {}) => `
Generate a playlist with exactly ${songCount} songs.

Playlist description: ${description}

${options.era ? `Era/Decade: ${options.era}` : ''}
${options.mood ? `Mood: ${options.mood}` : ''}
${options.energy ? `Energy level: ${options.energy}/10` : ''}
${options.explicit !== undefined ? `Explicit content: ${options.explicit ? 'allowed' : 'clean only'}` : ''}

Output only the song list in "Artist - Title" format, one per line.
`;

// Example input:
// description: "Party playlist"
// songCount: 30
// options: { era: "2010s-2020s", mood: "energetic", energy: 9, explicit: false }
```

### Complete AI Request Function

```javascript
async function generatePlaylist(description, { songCount, durationMinutes }) {
  const messages = [
    {
      role: "system",
      content: SYSTEM_PROMPT
    },
    {
      role: "user",
      content: durationMinutes
        ? USER_PROMPT_BY_DURATION(description, durationMinutes)
        : USER_PROMPT_BY_COUNT(description, songCount)
    }
  ];

  // OpenRouter format
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.FRONTEND_URL,
      'X-Title': 'Christmas Spotify Playlist Uploader'
    },
    body: JSON.stringify({
      model: 'openai/gpt-3.5-turbo',
      messages: messages,
      temperature: 0.8, // Creative but not too random
      max_tokens: 1500, // ~50 songs max
      top_p: 0.9
    })
  });

  const data = await response.json();
  return data.choices[0].message.content;
}
```

### Example Prompts & Expected Outputs

#### Example 1: Workout Playlist
**Input:**
- Description: "High-energy gym workout music with electronic and hip-hop"
- Song Count: 20

**Expected Output:**
```
Eminem - Till I Collapse
Kanye West - Stronger
The Prodigy - Firestarter
Rage Against the Machine - Bulls on Parade
Run The Jewels - Legend Has It
DMX - X Gon' Give It To Ya
Kendrick Lamar - HUMBLE.
Travis Scott - SICKO MODE
Skrillex - Bangarang
Daft Punk - Harder Better Faster Stronger
```

#### Example 2: Relaxing Evening
**Input:**
- Description: "Calm acoustic music for a quiet evening at home"
- Duration: 60 minutes (≈17 songs)

**Expected Output:**
```
Bon Iver - Holocene
Iron & Wine - Naked As We Came
José González - Heartbeats
Nick Drake - Pink Moon
Elliott Smith - Angeles
Sufjan Stevens - Chicago
Fleet Foxes - White Winter Hymnal
Simon & Garfunkel - The Sound of Silence
```

#### Example 3: 90s Nostalgia
**Input:**
- Description: "Best of 90s alternative rock and grunge"
- Song Count: 30

**Expected Output:**
```
Nirvana - Smells Like Teen Spirit
Pearl Jam - Alive
Soundgarden - Black Hole Sun
Alice in Chains - Man in the Box
Stone Temple Pilots - Plush
Radiohead - Creep
The Smashing Pumpkins - 1979
Foo Fighters - Everlong
```

---

## Architecture & Flow

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend (Svelte)                    │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  New Component: AIPlaylistGenerator.svelte             │ │
│  │                                                          │ │
│  │  - Description textarea                                 │ │
│  │  - Length type selector (songs vs duration)             │ │
│  │  - Number input (song count or minutes)                 │ │
│  │  - "Generate Playlist" button                           │ │
│  │  - Loading state                                        │ │
│  └────────────────────┬───────────────────────────────────┘ │
│                       │                                      │
│                       ▼                                      │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Existing: PlaylistUploader.svelte                     │ │
│  │                                                          │ │
│  │  - playlistText (auto-populated from AI)                │ │
│  │  - Search and export flow (unchanged)                   │ │
│  └────────────────────────────────────────────────────────┘ │
└───────────────────────┬──────────────────────────────────────┘
                        │
                        │ POST /api/ai/generate-playlist
                        │ { description, songCount?, durationMinutes? }
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                      Backend (Express.js)                    │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  New Route: /api/ai/generate-playlist                  │ │
│  │                                                          │ │
│  │  1. Validate user authentication                        │ │
│  │  2. Check rate limits (per user, per IP)                │ │
│  │  3. Validate input (description, length)                │ │
│  │  4. Call AI service                                     │ │
│  │  5. Parse and validate AI response                      │ │
│  │  6. Log usage for analytics                             │ │
│  └────────────────────┬───────────────────────────────────┘ │
│                       │                                      │
│                       ▼                                      │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  New Service: aiService.js                             │ │
│  │                                                          │ │
│  │  - generatePlaylist(description, options)               │ │
│  │  - buildPrompt(description, options)                    │ │
│  │  - callOpenRouter() / callGroq() with fallback          │ │
│  │  - parseAIResponse() → validate format                  │ │
│  └────────────────────┬───────────────────────────────────┘ │
└────────────────────────┼──────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              External AI API (OpenRouter/Groq)               │
│                                                              │
│  POST /api/v1/chat/completions                              │
│  {                                                           │
│    "model": "openai/gpt-3.5-turbo",                         │
│    "messages": [...],                                       │
│    "temperature": 0.8                                       │
│  }                                                           │
│                                                              │
│  Response:                                                   │
│  {                                                           │
│    "choices": [{                                            │
│      "message": {                                           │
│        "content": "Artist - Song\nArtist - Song\n..."       │
│      }                                                       │
│    }]                                                        │
│  }                                                           │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

```
1. User Input
   ↓
   {
     description: "Upbeat 80s pop for a road trip",
     lengthType: "songs",
     songCount: 25
   }

2. Frontend Validation
   ↓
   POST /api/ai/generate-playlist
   Headers: { Cookie: session_cookie }

3. Backend Processing
   ↓
   - Authenticate user
   - Check rate limit (max 5 per user per day)
   - Build AI prompt
   - Call OpenRouter API

4. AI Response
   ↓
   "Michael Jackson - Beat It
    Cyndi Lauper - Girls Just Want to Have Fun
    Queen - Don't Stop Me Now
    ..."

5. Response Processing
   ↓
   - Validate format (Artist - Title per line)
   - Count songs (ensure matches request)
   - Return to frontend

6. Frontend Auto-Population
   ↓
   playlistText = aiResponse
   (User can now edit, search, export as normal)
```

---

## Technical Implementation

### Phase 1: Backend Infrastructure

#### 1.1 Environment Variables

Add to `.env.example`:

```bash
# AI Playlist Generator Configuration
# Choose one or more providers (fallback supported)

# OpenRouter (Recommended)
OPENROUTER_API_KEY=your_openrouter_api_key_here
OPENROUTER_MODEL=openai/gpt-3.5-turbo

# Alternative: Groq (Free Tier)
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama3-70b-8192

# Alternative: OpenAI Direct
OPENAI_API_KEY=your_openai_api_key_here

# Alternative: Google AI Studio
GOOGLE_AI_API_KEY=your_google_ai_api_key_here

# AI Service Settings
AI_PROVIDER=openrouter  # openrouter | groq | openai | google
AI_FALLBACK_PROVIDER=groq  # Optional fallback

# Rate Limiting
AI_RATE_LIMIT_PER_USER_DAILY=5
AI_RATE_LIMIT_PER_IP_HOURLY=10
AI_MAX_SONGS_PER_REQUEST=50
AI_MAX_DURATION_MINUTES=180
```

#### 1.2 Install Dependencies

```bash
# Backend dependencies
cd backend
npm install --save axios

# For rate limiting (if not already installed)
npm install --save express-rate-limit rate-limit-mongo
```

#### 1.3 File Structure

```
backend/
├── src/
│   ├── services/
│   │   ├── spotifyService.js (existing)
│   │   └── aiService.js (NEW)
│   ├── routes/
│   │   ├── api.js (existing)
│   │   ├── auth.js (existing)
│   │   └── aiRoutes.js (NEW)
│   ├── middleware/
│   │   ├── auth.js (existing)
│   │   └── aiRateLimit.js (NEW)
│   ├── utils/
│   │   ├── logger.js (existing)
│   │   └── aiPrompts.js (NEW)
│   └── server.js (update to include AI routes)
```

---

## Backend Implementation

### File 1: `backend/src/utils/aiPrompts.js`

```javascript
/**
 * AI Prompt Templates for Playlist Generation
 */

export const SYSTEM_PROMPT = `You are a music expert and playlist curator. Your task is to generate song playlists based on user descriptions.

RULES:
1. Output ONLY a list of songs, one per line
2. Format: "Artist - Song Title" (exactly this format)
3. Use real, popular songs that exist on Spotify
4. Match the user's requested style, mood, genre, and era
5. Ensure songs fit together cohesively
6. Prioritize well-known songs that are likely to be found on Spotify
7. Do NOT include:
   - Song explanations or descriptions
   - Numbering (1., 2., etc.)
   - Any additional text or commentary
   - Album names or years
   - Asterisks, bullets, or other formatting
8. If duration is specified, estimate ~3.5 minutes per song average
9. Provide diverse artists (avoid repeating same artist unless requested)
10. Consider the playlist flow and energy progression

OUTPUT FORMAT EXAMPLE:
Daft Punk - One More Time
The Chemical Brothers - Block Rockin' Beats
Fatboy Slim - Right Here, Right Now
Basement Jaxx - Where's Your Head At`;

export function buildUserPrompt(description, options = {}) {
  const { songCount, durationMinutes } = options;

  let prompt = '';

  if (durationMinutes) {
    const estimatedSongs = Math.round(durationMinutes / 3.5);
    prompt = `Generate a playlist that lasts approximately ${durationMinutes} minutes.
Assume average song length is 3.5 minutes.
You need approximately ${estimatedSongs} songs.

`;
  } else {
    prompt = `Generate a playlist with exactly ${songCount} songs.

`;
  }

  prompt += `Playlist description: ${description}

Output only the song list in "Artist - Title" format, one per line. No additional text.`;

  return prompt;
}

export function buildMessages(description, options) {
  return [
    {
      role: 'system',
      content: SYSTEM_PROMPT
    },
    {
      role: 'user',
      content: buildUserPrompt(description, options)
    }
  ];
}
```

### File 2: `backend/src/services/aiService.js`

```javascript
/**
 * AI Service for Playlist Generation
 * Supports multiple AI providers with fallback
 */

import axios from 'axios';
import axiosRetry from 'axios-retry';
import logger from '../utils/logger.js';
import { buildMessages } from '../utils/aiPrompts.js';

// Configure axios retry for AI API calls
axiosRetry(axios, {
  retries: 2,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error) => {
    return axiosRetry.isNetworkOrIdempotentRequestError(error) ||
      error.response?.status === 429 ||
      (error.response?.status >= 500 && error.response?.status < 600);
  }
});

/**
 * Call OpenRouter API
 */
async function callOpenRouter(messages, model) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY not configured');
  }

  logger.info('Calling OpenRouter API', { model });

  const response = await axios.post(
    'https://openrouter.ai/api/v1/chat/completions',
    {
      model: model || process.env.OPENROUTER_MODEL || 'openai/gpt-3.5-turbo',
      messages: messages,
      temperature: 0.8,
      max_tokens: 1500,
      top_p: 0.9
    },
    {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost',
        'X-Title': 'Christmas Spotify Playlist Uploader'
      },
      timeout: 30000
    }
  );

  return response.data.choices[0].message.content;
}

/**
 * Call Groq API
 */
async function callGroq(messages, model) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY not configured');
  }

  logger.info('Calling Groq API', { model });

  const response = await axios.post(
    'https://api.groq.com/openai/v1/chat/completions',
    {
      model: model || process.env.GROQ_MODEL || 'llama3-70b-8192',
      messages: messages,
      temperature: 0.8,
      max_tokens: 1500,
      top_p: 0.9
    },
    {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    }
  );

  return response.data.choices[0].message.content;
}

/**
 * Call OpenAI API directly
 */
async function callOpenAI(messages, model) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  logger.info('Calling OpenAI API', { model });

  const response = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model: model || 'gpt-3.5-turbo',
      messages: messages,
      temperature: 0.8,
      max_tokens: 1500,
      top_p: 0.9
    },
    {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    }
  );

  return response.data.choices[0].message.content;
}

/**
 * Parse and validate AI response
 */
function parsePlaylistResponse(content) {
  // Remove any numbering, bullets, or extra formatting
  const lines = content
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map(line => {
      // Remove numbering like "1. ", "1) ", "- ", "* "
      return line.replace(/^[\d]+[\.\)]\s*/, '')
                 .replace(/^[\-\*]\s*/, '')
                 .trim();
    })
    .filter(line => {
      // Validate format: "Artist - Title"
      return line.includes(' - ') && line.split(' - ').length === 2;
    });

  if (lines.length === 0) {
    throw new Error('AI response contained no valid songs in "Artist - Title" format');
  }

  logger.info('Parsed AI playlist response', {
    totalSongs: lines.length,
    firstSong: lines[0],
    lastSong: lines[lines.length - 1]
  });

  return lines.join('\n');
}

/**
 * Generate playlist using AI
 * @param {string} description - Playlist description
 * @param {object} options - { songCount?, durationMinutes? }
 * @returns {string} Playlist in "Artist - Title" format
 */
export async function generatePlaylist(description, options = {}) {
  const { songCount, durationMinutes } = options;

  // Validation
  if (!description || description.trim().length === 0) {
    throw new Error('Playlist description is required');
  }

  if (!songCount && !durationMinutes) {
    throw new Error('Either songCount or durationMinutes must be provided');
  }

  const maxSongs = parseInt(process.env.AI_MAX_SONGS_PER_REQUEST || '50');
  const maxDuration = parseInt(process.env.AI_MAX_DURATION_MINUTES || '180');

  if (songCount && (songCount < 1 || songCount > maxSongs)) {
    throw new Error(`Song count must be between 1 and ${maxSongs}`);
  }

  if (durationMinutes && (durationMinutes < 5 || durationMinutes > maxDuration)) {
    throw new Error(`Duration must be between 5 and ${maxDuration} minutes`);
  }

  // Build messages
  const messages = buildMessages(description, { songCount, durationMinutes });

  // Determine provider
  const provider = process.env.AI_PROVIDER || 'openrouter';
  const fallbackProvider = process.env.AI_FALLBACK_PROVIDER;

  let content;
  let usedProvider = provider;

  try {
    // Try primary provider
    if (provider === 'openrouter') {
      content = await callOpenRouter(messages);
    } else if (provider === 'groq') {
      content = await callGroq(messages);
    } else if (provider === 'openai') {
      content = await callOpenAI(messages);
    } else {
      throw new Error(`Unknown AI provider: ${provider}`);
    }
  } catch (error) {
    logger.logError(error, {
      context: 'AI playlist generation - primary provider',
      provider: provider
    });

    // Try fallback provider
    if (fallbackProvider && fallbackProvider !== provider) {
      logger.info('Attempting fallback provider', { fallbackProvider });
      usedProvider = fallbackProvider;

      try {
        if (fallbackProvider === 'openrouter') {
          content = await callOpenRouter(messages);
        } else if (fallbackProvider === 'groq') {
          content = await callGroq(messages);
        } else if (fallbackProvider === 'openai') {
          content = await callOpenAI(messages);
        }
      } catch (fallbackError) {
        logger.logError(fallbackError, {
          context: 'AI playlist generation - fallback provider',
          provider: fallbackProvider
        });
        throw new Error('AI service temporarily unavailable. Please try again later.');
      }
    } else {
      throw new Error('AI service temporarily unavailable. Please try again later.');
    }
  }

  // Parse and validate response
  const playlist = parsePlaylistResponse(content);

  logger.info('AI playlist generated successfully', {
    provider: usedProvider,
    description: description.substring(0, 50),
    songCount: playlist.split('\n').length
  });

  return playlist;
}

/**
 * Get AI service status
 */
export function getServiceStatus() {
  return {
    primaryProvider: process.env.AI_PROVIDER || 'openrouter',
    fallbackProvider: process.env.AI_FALLBACK_PROVIDER || 'none',
    configured: {
      openrouter: !!process.env.OPENROUTER_API_KEY,
      groq: !!process.env.GROQ_API_KEY,
      openai: !!process.env.OPENAI_API_KEY
    }
  };
}
```

### File 3: `backend/src/middleware/aiRateLimit.js`

```javascript
/**
 * Rate Limiting Middleware for AI API
 * Prevents abuse and controls costs
 */

import rateLimit from 'express-rate-limit';
import MongoStore from 'rate-limit-mongo';
import logger from '../utils/logger.js';

const mongoUri = process.env.MONGO_URI || 'mongodb://mongodb:27017/spotify-uploader';

// Per-user daily limit
export const userDailyLimit = rateLimit({
  store: new MongoStore({
    uri: mongoUri,
    collectionName: 'ai_rate_limits_user',
    expireTimeMs: 24 * 60 * 60 * 1000 // 24 hours
  }),
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: parseInt(process.env.AI_RATE_LIMIT_PER_USER_DAILY || '5'),
  keyGenerator: (req) => {
    // Use user ID from session
    return req.session?.user?.id || req.ip;
  },
  handler: (req, res) => {
    logger.warn('AI rate limit exceeded - daily user limit', {
      userId: req.session?.user?.id,
      ip: req.ip
    });
    res.status(429).json({
      error: 'Daily AI generation limit reached. Please try again tomorrow.',
      retryAfter: '24 hours'
    });
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Per-IP hourly limit (prevents abuse)
export const ipHourlyLimit = rateLimit({
  store: new MongoStore({
    uri: mongoUri,
    collectionName: 'ai_rate_limits_ip',
    expireTimeMs: 60 * 60 * 1000 // 1 hour
  }),
  windowMs: 60 * 60 * 1000, // 1 hour
  max: parseInt(process.env.AI_RATE_LIMIT_PER_IP_HOURLY || '10'),
  keyGenerator: (req) => req.ip,
  handler: (req, res) => {
    logger.warn('AI rate limit exceeded - hourly IP limit', {
      ip: req.ip
    });
    res.status(429).json({
      error: 'Too many AI generation requests. Please try again later.',
      retryAfter: '1 hour'
    });
  },
  standardHeaders: true,
  legacyHeaders: false
});
```

### File 4: `backend/src/routes/aiRoutes.js`

```javascript
/**
 * AI Playlist Generator Routes
 */

import express from 'express';
import { generatePlaylist, getServiceStatus } from '../services/aiService.js';
import { requireAuth } from '../middleware/auth.js';
import { userDailyLimit, ipHourlyLimit } from '../middleware/aiRateLimit.js';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * POST /api/ai/generate-playlist
 * Generate a playlist using AI
 */
router.post(
  '/generate-playlist',
  requireAuth,
  ipHourlyLimit,
  userDailyLimit,
  async (req, res) => {
    try {
      const { description, songCount, durationMinutes } = req.body;

      logger.info('AI playlist generation requested', {
        userId: req.session.user.id,
        description: description?.substring(0, 50),
        songCount,
        durationMinutes
      });

      // Validate input
      if (!description || typeof description !== 'string') {
        return res.status(400).json({
          error: 'Playlist description is required'
        });
      }

      if (description.length < 5 || description.length > 500) {
        return res.status(400).json({
          error: 'Description must be between 5 and 500 characters'
        });
      }

      if (!songCount && !durationMinutes) {
        return res.status(400).json({
          error: 'Either songCount or durationMinutes must be provided'
        });
      }

      if (songCount && !Number.isInteger(songCount)) {
        return res.status(400).json({
          error: 'Song count must be an integer'
        });
      }

      if (durationMinutes && !Number.isInteger(durationMinutes)) {
        return res.status(400).json({
          error: 'Duration must be an integer'
        });
      }

      // Generate playlist
      const startTime = Date.now();
      const playlist = await generatePlaylist(description, {
        songCount,
        durationMinutes
      });
      const duration = Date.now() - startTime;

      logger.info('AI playlist generation completed', {
        userId: req.session.user.id,
        duration: `${duration}ms`,
        songCount: playlist.split('\n').length
      });

      res.json({
        success: true,
        playlist: playlist,
        metadata: {
          songCount: playlist.split('\n').length,
          generationTime: duration
        }
      });
    } catch (error) {
      logger.logError(error, {
        context: 'AI playlist generation endpoint',
        userId: req.session?.user?.id
      });

      res.status(500).json({
        error: error.message || 'Failed to generate playlist'
      });
    }
  }
);

/**
 * GET /api/ai/status
 * Get AI service status (for debugging)
 */
router.get('/status', requireAuth, (req, res) => {
  const status = getServiceStatus();
  res.json(status);
});

export default router;
```

### File 5: Update `backend/src/server.js`

```javascript
// Add this import
import aiRoutes from './routes/aiRoutes.js';

// Add this route (after other API routes)
app.use('/api/ai', aiRoutes);
```

### File 6: Update `backend/package.json`

```json
{
  "dependencies": {
    "express-rate-limit": "^7.1.5",
    "rate-limit-mongo": "^2.3.2"
  }
}
```

---

## Frontend Implementation

### File 1: `frontend/src/components/AIPlaylistGenerator.svelte`

```svelte
<script>
  import { createEventDispatcher } from 'svelte';

  export let onGenerate; // Callback when playlist is generated

  const dispatch = createEventDispatcher();

  let description = '';
  let lengthType = 'songs'; // 'songs' or 'duration'
  let songCount = 20;
  let durationMinutes = 60;
  let loading = false;
  let expanded = false;

  async function handleGenerate() {
    if (!description.trim()) {
      dispatch('notification', {
        message: 'Please describe your playlist',
        type: 'error'
      });
      return;
    }

    if (description.length < 5) {
      dispatch('notification', {
        message: 'Description too short. Be more specific!',
        type: 'error'
      });
      return;
    }

    loading = true;

    try {
      const response = await fetch('/api/ai/generate-playlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          description: description.trim(),
          songCount: lengthType === 'songs' ? songCount : undefined,
          durationMinutes: lengthType === 'duration' ? durationMinutes : undefined
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate playlist');
      }

      const data = await response.json();

      dispatch('notification', {
        message: `Generated ${data.metadata.songCount} songs! Review and search.`,
        type: 'success'
      });

      // Call parent callback with generated playlist
      onGenerate(data.playlist);

      // Collapse the AI generator after successful generation
      expanded = false;
    } catch (error) {
      dispatch('notification', {
        message: error.message,
        type: 'error'
      });
    } finally {
      loading = false;
    }
  }

  function toggleExpanded() {
    expanded = !expanded;
  }
</script>

<div class="ai-generator">
  <button class="toggle-button" on:click={toggleExpanded}>
    <span class="icon">{expanded ? '🔽' : '🤖'}</span>
    <span class="text">
      {expanded ? 'Hide AI Generator' : 'Generate Playlist with AI'}
    </span>
    <span class="badge">NEW</span>
  </button>

  {#if expanded}
    <div class="ai-form">
      <div class="form-header">
        <h3>🎵 AI Playlist Generator</h3>
        <p>Describe your perfect playlist and let AI create it for you!</p>
      </div>

      <div class="form-group">
        <label for="description">Playlist Description</label>
        <textarea
          id="description"
          bind:value={description}
          placeholder="e.g., Upbeat 80s pop for a road trip, Relaxing jazz for studying, High-energy workout music..."
          rows="3"
          maxlength="500"
          disabled={loading}
        ></textarea>
        <div class="char-count">{description.length}/500</div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="length-type">Playlist Length</label>
          <div class="radio-group">
            <label class="radio-label">
              <input
                type="radio"
                bind:group={lengthType}
                value="songs"
                disabled={loading}
              />
              <span>Number of Songs</span>
            </label>
            <label class="radio-label">
              <input
                type="radio"
                bind:group={lengthType}
                value="duration"
                disabled={loading}
              />
              <span>Duration (minutes)</span>
            </label>
          </div>
        </div>

        <div class="form-group">
          {#if lengthType === 'songs'}
            <label for="song-count">Number of Songs</label>
            <input
              id="song-count"
              type="number"
              bind:value={songCount}
              min="5"
              max="50"
              disabled={loading}
            />
          {:else}
            <label for="duration">Duration (minutes)</label>
            <input
              id="duration"
              type="number"
              bind:value={durationMinutes}
              min="15"
              max="180"
              disabled={loading}
            />
          {/if}
        </div>
      </div>

      <div class="examples">
        <strong>💡 Example prompts:</strong>
        <ul>
          <li>"Energetic EDM for a party"</li>
          <li>"Calm acoustic music for a quiet evening"</li>
          <li>"Best of 90s alternative rock"</li>
          <li>"Christmas songs for a family dinner"</li>
        </ul>
      </div>

      <button
        class="generate-button"
        on:click={handleGenerate}
        disabled={loading || !description.trim()}
      >
        {#if loading}
          <span class="spinner"></span>
          <span>Generating...</span>
        {:else}
          <span>✨ Generate Playlist</span>
        {/if}
      </button>

      <div class="disclaimer">
        <small>
          💡 <strong>Tip:</strong> You can edit the generated playlist before searching.
          Limited to 5 generations per day.
        </small>
      </div>
    </div>
  {/if}
</div>

<style>
  .ai-generator {
    margin-bottom: 2rem;
    background: linear-gradient(135deg, #667eea22 0%, #764ba222 100%);
    border: 2px solid var(--accent);
    border-radius: 12px;
    padding: 1.5rem;
  }

  .toggle-button {
    width: 100%;
    padding: 1rem 1.5rem;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 1.1rem;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    transition: all 0.3s ease;
    position: relative;
  }

  .toggle-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
  }

  .toggle-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .icon {
    font-size: 1.5rem;
  }

  .badge {
    position: absolute;
    top: -8px;
    right: -8px;
    background: #ff6b6b;
    color: white;
    font-size: 0.65rem;
    padding: 0.25rem 0.5rem;
    border-radius: 12px;
    font-weight: 700;
    letter-spacing: 0.5px;
  }

  .ai-form {
    margin-top: 1.5rem;
    padding-top: 1.5rem;
    border-top: 2px dashed var(--accent);
  }

  .form-header {
    margin-bottom: 1.5rem;
  }

  .form-header h3 {
    margin: 0 0 0.5rem 0;
    color: var(--accent);
    font-size: 1.4rem;
  }

  .form-header p {
    margin: 0;
    color: var(--text-secondary);
    font-size: 0.95rem;
  }

  .form-group {
    margin-bottom: 1.25rem;
  }

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }

  @media (max-width: 768px) {
    .form-row {
      grid-template-columns: 1fr;
    }
  }

  label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 600;
    color: var(--text-primary);
    font-size: 0.95rem;
  }

  textarea {
    width: 100%;
    padding: 0.75rem;
    border: 2px solid var(--border);
    border-radius: 8px;
    font-size: 1rem;
    font-family: inherit;
    resize: vertical;
    transition: border-color 0.2s;
  }

  textarea:focus {
    outline: none;
    border-color: var(--accent);
  }

  textarea:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .char-count {
    text-align: right;
    font-size: 0.85rem;
    color: var(--text-secondary);
    margin-top: 0.25rem;
  }

  .radio-group {
    display: flex;
    gap: 1.5rem;
    margin-top: 0.5rem;
  }

  .radio-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    font-weight: normal;
  }

  .radio-label input[type="radio"] {
    cursor: pointer;
  }

  input[type="number"] {
    width: 100%;
    padding: 0.75rem;
    border: 2px solid var(--border);
    border-radius: 8px;
    font-size: 1rem;
    transition: border-color 0.2s;
  }

  input[type="number"]:focus {
    outline: none;
    border-color: var(--accent);
  }

  input[type="number"]:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .examples {
    background: white;
    padding: 1rem;
    border-radius: 8px;
    margin-bottom: 1.25rem;
    border-left: 4px solid var(--accent);
  }

  .examples strong {
    color: var(--accent);
  }

  .examples ul {
    margin: 0.5rem 0 0 0;
    padding-left: 1.5rem;
  }

  .examples li {
    margin: 0.25rem 0;
    color: var(--text-secondary);
    font-size: 0.9rem;
  }

  .generate-button {
    width: 100%;
    padding: 1rem 1.5rem;
    background: linear-gradient(135deg, #00d2ff 0%, #3a47d5 100%);
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 1.1rem;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    transition: all 0.3s ease;
  }

  .generate-button:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(58, 71, 213, 0.4);
  }

  .generate-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .spinner {
    width: 1rem;
    height: 1rem;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .disclaimer {
    margin-top: 1rem;
    padding: 0.75rem;
    background: rgba(255, 193, 7, 0.1);
    border-radius: 6px;
    text-align: center;
  }

  .disclaimer small {
    color: var(--text-secondary);
    line-height: 1.4;
  }
</style>
```

### File 2: Update `frontend/src/components/PlaylistUploader.svelte`

Add the AI generator component at the top of the form:

```svelte
<script>
  // Add this import
  import AIPlaylistGenerator from './AIPlaylistGenerator.svelte';

  // Add this function
  function handleAIGenerate(generatedPlaylist) {
    playlistText = generatedPlaylist;
    // Optionally scroll to the textarea
    document.getElementById('playlist-textarea')?.scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    });
  }
</script>

<!-- Add this before the existing input tabs -->
<AIPlaylistGenerator
  onGenerate={handleAIGenerate}
  on:notification
/>

<!-- Update the textarea to have an ID -->
<textarea
  id="playlist-textarea"
  bind:value={playlistText}
  placeholder="Paste your songs here..."
  rows="10"
></textarea>
```

---

## Testing Strategy

### Backend Unit Tests

Create `backend/src/services/__tests__/aiService.test.js`:

```javascript
import { generatePlaylist, getServiceStatus } from '../aiService.js';

describe('aiService', () => {
  describe('generatePlaylist', () => {
    it('should generate playlist by song count', async () => {
      const playlist = await generatePlaylist('Upbeat pop music', {
        songCount: 10
      });

      expect(playlist).toBeDefined();
      const songs = playlist.split('\n');
      expect(songs.length).toBeGreaterThanOrEqual(8); // Allow some variance
      expect(songs.length).toBeLessThanOrEqual(12);

      // Check format
      songs.forEach(song => {
        expect(song).toMatch(/^.+ - .+$/);
      });
    });

    it('should generate playlist by duration', async () => {
      const playlist = await generatePlaylist('Relaxing jazz', {
        durationMinutes: 30
      });

      expect(playlist).toBeDefined();
      const songs = playlist.split('\n');
      // ~30 minutes / 3.5 minutes per song ≈ 8-9 songs
      expect(songs.length).toBeGreaterThanOrEqual(6);
      expect(songs.length).toBeLessThanOrEqual(12);
    });

    it('should throw error for invalid input', async () => {
      await expect(generatePlaylist('', { songCount: 10 }))
        .rejects.toThrow('description is required');
    });

    it('should throw error for too many songs', async () => {
      await expect(generatePlaylist('Music', { songCount: 1000 }))
        .rejects.toThrow();
    });
  });

  describe('getServiceStatus', () => {
    it('should return service status', () => {
      const status = getServiceStatus();
      expect(status).toHaveProperty('primaryProvider');
      expect(status).toHaveProperty('configured');
    });
  });
});
```

### Frontend Tests

Create `frontend/src/components/__tests__/AIPlaylistGenerator.test.js`:

```javascript
import { render, fireEvent, waitFor } from '@testing-library/svelte';
import AIPlaylistGenerator from '../AIPlaylistGenerator.svelte';

describe('AIPlaylistGenerator', () => {
  it('renders toggle button', () => {
    const { getByText } = render(AIPlaylistGenerator, {
      props: { onGenerate: () => {} }
    });
    expect(getByText(/Generate Playlist with AI/i)).toBeInTheDocument();
  });

  it('expands form when clicked', async () => {
    const { getByText, getByLabelText } = render(AIPlaylistGenerator, {
      props: { onGenerate: () => {} }
    });

    const toggle = getByText(/Generate Playlist with AI/i);
    await fireEvent.click(toggle);

    expect(getByLabelText(/Playlist Description/i)).toBeInTheDocument();
  });

  it('validates description before generating', async () => {
    const { getByText, getByRole } = render(AIPlaylistGenerator, {
      props: { onGenerate: () => {} }
    });

    // Expand
    await fireEvent.click(getByText(/Generate Playlist with AI/i));

    // Try to generate without description
    const generateButton = getByText(/✨ Generate Playlist/i);
    expect(generateButton).toBeDisabled();
  });
});
```

### Manual Testing Checklist

- [ ] AI generator toggles open/closed
- [ ] Description textarea accepts input (5-500 chars)
- [ ] Can switch between "songs" and "duration" modes
- [ ] Number inputs validate min/max ranges
- [ ] Generate button disabled when description empty
- [ ] Loading state shows spinner
- [ ] Generated playlist populates textarea
- [ ] Can edit generated playlist before searching
- [ ] Error messages display for rate limits
- [ ] Works with existing search/export flow

---

## Rate Limiting & Cost Control

### User Limits

```javascript
// Default limits (configurable via .env)
- Per user: 5 generations per day
- Per IP: 10 generations per hour
- Max songs per request: 50
- Max duration: 180 minutes
```

### Cost Estimation

**Scenario: 1000 active users**

Assumptions:
- Average: 3 AI generations per user per week
- Average: 25 songs per playlist
- Tokens per request: ~300 input + ~400 output = 700 tokens

**Monthly Usage:**
```
1000 users × 3 generations/week × 4 weeks = 12,000 requests/month
12,000 requests × 700 tokens = 8.4M tokens/month
```

**Cost with OpenRouter (GPT-3.5):**
```
8.4M tokens × $0.0005 per 1K tokens = $4.20/month
```

**Cost with Groq (Free Tier):**
```
1000 requests/day limit = 30,000 requests/month (free)
Our usage: 12,000 requests/month
Cost: $0/month (within free tier)
```

### Cost Monitoring

Add to `backend/src/services/aiService.js`:

```javascript
// Log token usage for cost tracking
logger.info('AI token usage', {
  provider: usedProvider,
  inputTokens: messages.reduce((sum, m) => sum + m.content.length / 4, 0),
  outputTokens: content.length / 4,
  estimatedCost: (content.length / 4) * 0.000001 * 1.5 // rough estimate
});
```

---

## Security Considerations

### API Key Protection

```javascript
// ✅ CORRECT: API keys in environment variables
const apiKey = process.env.OPENROUTER_API_KEY;

// ❌ WRONG: Never expose API keys to frontend
// Frontend should NEVER call AI APIs directly
```

### Input Sanitization

```javascript
// Validate and sanitize user input
description = description
  .trim()
  .substring(0, 500) // Max length
  .replace(/[<>]/g, ''); // Remove HTML tags
```

### Rate Limiting Layers

1. **IP-based** - Prevents bot abuse
2. **User-based** - Fair usage per account
3. **Session-based** - Additional protection
4. **MongoDB store** - Persistent limits across restarts

### Prompt Injection Prevention

```javascript
// The SYSTEM_PROMPT ensures AI stays focused on music
// User input is treated as description only
// AI cannot execute commands or access sensitive data
```

---

## Deployment Steps

### Phase 1: Backend Setup (30 minutes)

```bash
# 1. Add environment variables
nano .env
# Add OPENROUTER_API_KEY, AI_PROVIDER, rate limit settings

# 2. Install dependencies
cd backend
npm install

# 3. Test AI service
# Create test script: test-ai.js
node test-ai.js

# 4. Run tests
npm test
```

### Phase 2: Frontend Setup (20 minutes)

```bash
# 1. No new dependencies needed
cd frontend

# 2. Run tests
npm test

# 3. Build frontend
npm run build
```

### Phase 3: Integration Testing (15 minutes)

```bash
# 1. Start services
docker-compose -f docker-compose.oracle.yml up --build

# 2. Test AI generation flow:
# - Login
# - Open AI generator
# - Generate playlist
# - Verify auto-population
# - Search songs
# - Export to Spotify

# 3. Test rate limiting:
# - Generate 5 playlists (should work)
# - Try 6th (should fail with rate limit error)
```

### Phase 4: Production Deployment (See OFT.md)

Update `.env` on Oracle Cloud instance with AI API keys.

---

## Future Enhancements

### Phase 2 Features (Post-MVP)

1. **Advanced Filters**
   ```javascript
   - Decade filter (1960s, 1970s, etc.)
   - Explicit content toggle
   - Energy level slider (1-10)
   - Popularity filter (mainstream vs underground)
   ```

2. **AI Model Selection**
   ```javascript
   - Let users choose: "Creative" (GPT-4) vs "Fast" (Llama 3)
   - Premium tier for GPT-4 access
   ```

3. **Playlist Templates**
   ```javascript
   - Pre-made prompts: "Workout", "Study", "Party", "Road Trip"
   - One-click generation
   ```

4. **AI Refinement**
   ```javascript
   - "Regenerate" button (same prompt, different songs)
   - "More like this" (expand on selected songs)
   - "Replace song" AI suggestion
   ```

5. **History & Favorites**
   ```javascript
   - Save AI-generated prompts
   - Mark favorite generations
   - Re-use past prompts
   ```

6. **Analytics**
   ```javascript
   - Track most popular prompt styles
   - Success rate (how many AI playlists get exported)
   - User feedback on AI quality
   ```

---

## Summary

### What We're Building

✅ **AI-powered playlist generator** integrated into existing app
✅ **Natural language input** - users describe what they want
✅ **Flexible length** - by song count OR duration
✅ **Auto-population** - seamless integration with current flow
✅ **Cost-effective** - free tier options available
✅ **Rate-limited** - 5 generations per user per day
✅ **Production-ready** - error handling, logging, fallbacks

### Tech Stack

- **AI Provider:** OpenRouter (primary) + Groq (fallback)
- **Model:** GPT-3.5 Turbo / Llama 3 70B
- **Backend:** Express.js + aiService.js
- **Frontend:** Svelte component (AIPlaylistGenerator.svelte)
- **Rate Limiting:** express-rate-limit + MongoDB store
- **Cost:** ~$5-10/month for 1000 users

### Timeline Estimate

- **Backend:** 4-6 hours
- **Frontend:** 3-4 hours
- **Testing:** 2-3 hours
- **Deployment:** 1-2 hours
- **Total:** 10-15 hours

---

**Document Version:** 1.0
**Date:** December 15, 2025
**Status:** Ready for Implementation

🎵 Let's make playlist creation magical with AI! ✨
