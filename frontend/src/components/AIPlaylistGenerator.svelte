<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { ai } from '../lib/api';

  export let onGenerate: (playlist: string) => void;

  const dispatch = createEventDispatcher<{
    notification: { message: string; type: 'success' | 'error' | 'info' };
  }>();

  let description: string = '';
  let lengthType: 'songs' | 'duration' = 'songs';
  let songCount: number = 20;
  let durationMinutes: number = 60;
  let loading: boolean = false;
  let expanded: boolean = false;

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

      // Collapse the AI generator after successful generation
      expanded = false;
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

  function toggleExpanded(): void {
    expanded = !expanded;
  }
</script>

<div class="ai-generator">
  <button class="toggle-button" on:click={toggleExpanded} type="button">
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
        type="button"
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
