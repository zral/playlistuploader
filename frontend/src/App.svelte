<script lang="ts">
  import { onMount } from 'svelte';
  import { auth } from './lib/api';
  import type { UserResponse } from './types/api';
  import Header from './components/Header.svelte';
  import Login from './components/Login.svelte';
  import PlaylistUploader from './components/PlaylistUploader.svelte';
  import About from './components/About.svelte';
  import Notification from './components/Notification.svelte';

  type NotificationType = 'info' | 'success' | 'error';

  interface NotificationState {
    show: boolean;
    message: string;
    type: NotificationType;
  }

  let user: UserResponse | null = null;
  let loading: boolean = true;
  let notification: NotificationState = { show: false, message: '', type: 'info' };
  let currentPath: string = '/';

  onMount(async () => {
    // Set initial path
    currentPath = window.location.pathname;

    // Listen for navigation changes
    window.addEventListener('popstate', () => {
      currentPath = window.location.pathname;
    });

    // Check for auth callback
    const params = new URLSearchParams(window.location.search);
    if (params.has('auth')) {
      if (params.get('auth') === 'success') {
        showNotification('Successfully logged in!', 'success');
      }
      // Clean up URL
      window.history.replaceState({}, '', '/');
    }

    if (params.has('error')) {
      showNotification('Authentication failed: ' + params.get('error'), 'error');
      window.history.replaceState({}, '', '/');
    }

    // Check if user is already logged in
    await checkAuth();
  });

  async function checkAuth(): Promise<void> {
    try {
      user = await auth.getMe();
    } catch (error) {
      user = null;
    } finally {
      loading = false;
    }
  }

  async function handleLogout(): Promise<void> {
    try {
      await auth.logout();
      user = null;
      showNotification('Logged out successfully', 'info');
    } catch (error) {
      showNotification('Logout failed', 'error');
    }
  }

  function showNotification(message: string, type: NotificationType = 'info'): void {
    notification = { show: true, message, type };
    setTimeout(() => {
      notification = { show: false, message: '', type: 'info' };
    }, 5000);
  }

  function navigate(path: string): void {
    currentPath = path;
    window.history.pushState({}, '', path);
  }
</script>

<main>
  <div class="container">
    <Header {user} on:logout={handleLogout} />

    {#if currentPath === '/about'}
      <About />
      <div class="back-link">
        <button class="link-button" on:click={() => navigate('/')}>
          ← Back to App
        </button>
      </div>
    {:else if loading}
      <div class="loading-container">
        <div class="spinner"></div>
        <p>Loading...</p>
      </div>
    {:else if !user}
      <Login on:notification={(e) => showNotification(e.detail.message, e.detail.type)} />
      <div class="about-link">
        <button class="link-button" on:click={() => navigate('/about')}>
          Learn more about Listify →
        </button>
      </div>
    {:else}
      <PlaylistUploader {user} on:notification={(e) => showNotification(e.detail.message, e.detail.type)} />
      <div class="about-link">
        <button class="link-button" on:click={() => navigate('/about')}>
          About Listify →
        </button>
      </div>
    {/if}
  </div>

  {#if notification.show}
    <Notification message={notification.message} type={notification.type} />
  {/if}
</main>

<style>
  main {
    min-height: 100vh;
    padding: 2rem 0;
  }

  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    padding: 4rem 0;
  }

  .loading-container p {
    color: var(--text-secondary);
    font-size: 1.1rem;
  }

  .about-link,
  .back-link {
    text-align: center;
    margin-top: 2rem;
    padding-bottom: 2rem;
  }

  .link-button {
    background: transparent;
    border: none;
    color: var(--christmas-gold);
    font-size: 1rem;
    cursor: pointer;
    text-decoration: underline;
    transition: color 0.3s ease;
  }

  .link-button:hover {
    color: var(--christmas-light-red);
  }
</style>
