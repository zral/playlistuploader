<script lang="ts">
  export let message: string = '';
  export let type: 'info' | 'success' | 'error' = 'info';
</script>

<div class="notification {type}">
  <span class="icon">
    {#if type === 'success'}
      ✅
    {:else if type === 'error'}
      ❌
    {:else}
      ℹ️
    {/if}
  </span>
  <span class="message">{message}</span>
</div>

<style>
  .notification {
    position: fixed;
    top: 2rem;
    right: 2rem;
    padding: 1rem 1.5rem;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-weight: 500;
    z-index: 1000;
    animation: slideIn 0.3s ease-out;
    max-width: 400px;
  }

  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  .notification.info {
    background: var(--bg-card);
    border: 2px solid var(--accent-gold);
    color: var(--text-primary);
  }

  .notification.success {
    background: var(--christmas-green);
    border: 2px solid var(--christmas-dark-green);
    color: white;
  }

  .notification.error {
    background: var(--christmas-red);
    border: 2px solid var(--christmas-dark-red);
    color: white;
  }

  .icon {
    font-size: 1.5rem;
  }

  .message {
    flex: 1;
  }

  @media (max-width: 768px) {
    .notification {
      top: 1rem;
      right: 1rem;
      left: 1rem;
      max-width: none;
    }
  }
</style>
