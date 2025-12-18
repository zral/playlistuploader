<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { auth } from '../lib/api';

  const dispatch = createEventDispatcher<{
    notification: { message: string; type: 'info' | 'success' | 'error' };
  }>();

  let loading: boolean = false;

  async function handleLogin(): Promise<void> {
    loading = true;
    try {
      const data = await auth.login();
      // Redirect to Spotify authorization
      window.location.href = data.authUrl;
    } catch (error) {
      loading = false;
      dispatch('notification', {
        message: 'Failed to initiate login',
        type: 'error',
      });
    }
  }
</script>

<div class="login-container">
  <div class="card login-card">
    <div class="christmas-icon">🎅</div>
    <h2>Listify your vibe</h2>
    <p class="description">
      Turn your music taste into awesome playlists in seconds! You bring the vibe, we do the magic. Your vibe, your way. 🎧
    </p>

    <div class="features">
      <div class="feature">
        <span class="feature-icon">🎵</span>
        <p>Smart song matching</p>
      </div>
      <div class="feature">
        <span class="feature-icon">📝</span>
        <p>Paste your playlist</p>
      </div>
      <div class="feature">
        <span class="feature-icon">✨</span>
        <p>Instant upload</p>
      </div>
    </div>

    <button class="primary login-button" on:click={handleLogin} disabled={loading}>
      {#if loading}
        <div class="spinner small"></div>
        Connecting to Spotify...
      {:else}
        🎄 Login with Spotify
      {/if}
    </button>

    <p class="disclaimer">
      You'll be redirected to Spotify to authorize this application.
      We only request permissions to manage your playlists.
    </p>
  </div>
</div>

<style>
  .login-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 60vh;
  }

  .login-card {
    max-width: 500px;
    text-align: center;
  }

  .christmas-icon {
    font-size: 4rem;
    margin-bottom: 1rem;
    animation: bounce 2s ease-in-out infinite;
  }

  @keyframes bounce {
    0%, 100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-10px);
    }
  }

  .description {
    color: var(--text-secondary);
    margin-bottom: 2rem;
    line-height: 1.6;
  }

  .features {
    display: flex;
    justify-content: space-around;
    gap: 1rem;
    margin-bottom: 2rem;
  }

  .feature {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
  }

  .feature-icon {
    font-size: 2rem;
  }

  .feature p {
    color: var(--text-secondary);
    font-size: 0.9rem;
  }

  .login-button {
    width: 100%;
    font-size: 1.1rem;
    padding: 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
  }

  .disclaimer {
    margin-top: 1.5rem;
    font-size: 0.85rem;
    color: var(--text-secondary);
    font-style: italic;
  }

  .spinner.small {
    width: 20px;
    height: 20px;
    border-width: 2px;
  }
</style>
