<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { UserResponse } from '../types/api';

  export let user: UserResponse | null = null;

  const dispatch = createEventDispatcher<{
    logout: void;
  }>();

  function logout(): void {
    dispatch('logout');
  }
</script>

<header>
  <div class="header-content">
    <div class="title-section">
      <h1>🎵 Listify</h1>
      <div class="christmas-lights">
        <div class="light"></div>
        <div class="light"></div>
        <div class="light"></div>
        <div class="light"></div>
        <div class="light"></div>
      </div>
      <p class="subtitle">Listify your vibe</p>
    </div>

    {#if user}
      <div class="user-section">
        <div class="user-info">
          {#if user.user.images && user.user.images.length > 0}
            <img src={user.user.images[0].url} alt={user.user.display_name} class="user-avatar" />
          {/if}
          <div>
            <p class="user-name">{user.user.display_name}</p>
            <p class="user-email">{user.user.email}</p>
          </div>
        </div>
        <button class="secondary" on:click={logout}>Logout</button>
      </div>
    {/if}
  </div>
</header>

<style>
  header {
    margin-bottom: 2rem;
  }

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 2rem;
  }

  .title-section {
    flex: 1;
  }

  .subtitle {
    color: var(--text-secondary);
    margin-top: 0.5rem;
    font-size: 1.1rem;
  }

  .user-section {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .user-info {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .user-avatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    border: 2px solid var(--accent-gold);
  }

  .user-name {
    font-weight: 600;
    color: var(--text-primary);
  }

  .user-email {
    font-size: 0.85rem;
    color: var(--text-secondary);
  }

  @media (max-width: 768px) {
    .header-content {
      flex-direction: column;
      align-items: flex-start;
    }

    .user-section {
      width: 100%;
      justify-content: space-between;
    }
  }
</style>
