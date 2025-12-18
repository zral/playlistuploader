<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { ai } from '../lib/api';

  export let onGenerate: (playlist: string) => void;

  const dispatch = createEventDispatcher<{
    notification: { message: string; type: 'success' | 'error' | 'info' };
  }>();

  let description: string = '';
  let lengthType: 'songs' | 'duration' = 'songs';
  let songCount: number = 25;
  let durationMinutes: number = 90;
  let loading: boolean = false;

  async function handleGenerate(): Promise<void> {
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
      const data = await ai.generatePlaylist({
        description: description.trim(),
        songCount: lengthType === 'songs' ? songCount : undefined,
        durationMinutes: lengthType === 'duration' ? durationMinutes : undefined
      });

      dispatch('notification', {
        message: `Generated ${data.metadata.songCount} songs! Review and search.`,
        type: 'success'
      });

      // Call parent callback with generated playlist
      onGenerate(data.playlist);
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to generate playlist';
      dispatch('notification', {
        message: errorMessage,
        type: 'error'
      });
    } finally {
      loading = false;
    }
  }
</script>

<div class="ai-generator">
  <div class="form-header">
    <h2>Create Your Perfect Playlist</h2>
    <p class="subtitle">Describe your vibe, we'll find the tracks</p>
  </div>

  <div class="ai-form">

      <div class="form-group">
        <label for="description">What's the vibe?</label>
        <textarea
          id="description"
          bind:value={description}
          placeholder="Upbeat Nordic pop for a road trip, chill study music with piano, 90s hip-hop workout bangers..."
          rows="4"
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

      <button
        class="generate-button"
        on:click={handleGenerate}
        disabled={loading || !description.trim()}
        type="button"
      >
        {#if loading}
          <span class="spinner"></span>
          <span>Generating...</span>
        {:else}
          <span>Generate Playlist</span>
        {/if}
      </button>
    </div>
</div>

<style>
  .ai-generator {
    margin-bottom: 2rem;
    background: var(--bg-card);
    border: 2px solid var(--christmas-green);
    border-radius: 12px;
    padding: 2rem;
  }

  .form-header {
    margin-bottom: 1.5rem;
    text-align: center;
  }

  .form-header h2 {
    margin: 0 0 0.5rem 0;
    color: var(--text-primary);
    font-size: 2rem;
    font-weight: 700;
  }

  .form-header .subtitle {
    margin: 0;
    color: var(--text-secondary);
    font-size: 1rem;
    font-weight: 400;
  }

  .ai-form {
    margin-top: 1.5rem;
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
    padding: 1rem;
    border: 2px solid var(--border);
    border-radius: 8px;
    font-size: 1rem;
    font-family: inherit;
    resize: vertical;
    transition: all 0.3s ease;
    background: var(--bg-secondary);
    color: var(--text-primary);
  }

  textarea:focus {
    outline: none;
    border-color: var(--christmas-green);
    box-shadow: 0 0 0 3px rgba(22, 91, 51, 0.1);
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
    color: var(--text-primary);
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
    transition: all 0.2s;
    background: var(--bg-secondary);
    color: var(--text-primary);
  }

  input[type="number"]:focus {
    outline: none;
    border-color: var(--christmas-green);
    box-shadow: 0 0 0 3px rgba(22, 91, 51, 0.1);
  }

  input[type="number"]:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .generate-button {
    width: 100%;
    padding: 1rem 1.5rem;
    background: #1db954;
    color: white;
    border: none;
    border-radius: 50px;
    font-size: 1.1rem;
    font-weight: 700;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    transition: all 0.3s ease;
    box-shadow: 0 4px 15px rgba(29, 185, 84, 0.4);
  }

  .generate-button:hover:not(:disabled) {
    background: #1ed760;
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(29, 185, 84, 0.5);
  }

  .generate-button:disabled {
    opacity: 0.5;
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
</style>
