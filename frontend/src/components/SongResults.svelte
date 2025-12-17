<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { SearchResult, SpotifyTrack } from '../types/api';

  export let results: SearchResult[] = [];

  interface TrackSelection {
    included: boolean;
    selectedTrack: SpotifyTrack | null;
  }

  interface SelectionMap {
    [index: number]: TrackSelection;
  }

  const dispatch = createEventDispatcher<{
    selectionChange: { selectedTracks: SpotifyTrack[] };
  }>();

  // Track which songs are selected and which alternative is chosen
  let selections: SelectionMap = {};

  // Audio player state
  let currentlyPlaying: string | null = null;
  let audioElement: HTMLAudioElement | null = null;

  // Initialize selections when results change
  $: {
    if (results.length > 0) {
      selections = results.reduce((acc: SelectionMap, result, index) => {
        if (!acc[index]) {
          const firstTrack = result.tracks.length > 0 ? result.tracks[0] : null;
          acc[index] = {
            included: !!firstTrack, // Include if match found
            selectedTrack: firstTrack, // Default to first track
          };
        }
        return acc;
      }, selections);
      notifySelectionChange();
    }
  }

  // Preview player functionality - currently disabled for Development Mode apps
  // Spotify API does not provide preview URLs for apps in Development Mode
  function playPreview(previewUrl: string | null, trackId: string): void {
    if (!previewUrl) return;

    // Stop current playback
    if (audioElement) {
      audioElement.pause();
      audioElement = null;
    }

    // If clicking the same track, just stop
    if (currentlyPlaying === trackId) {
      currentlyPlaying = null;
      return;
    }

    // Play new track
    try {
      audioElement = new Audio(previewUrl);
      audioElement.volume = 0.5;

      audioElement.play()
        .then(() => {
          currentlyPlaying = trackId;
        })
        .catch((error) => {
          console.error('Error playing preview:', error);
          audioElement = null;
        });

      // Reset when finished
      audioElement.onended = (): void => {
        currentlyPlaying = null;
        audioElement = null;
      };

      // Handle errors
      audioElement.onerror = (error): void => {
        console.error('Audio element error:', error);
        currentlyPlaying = null;
        audioElement = null;
      };
    } catch (error) {
      console.error('Error creating Audio element:', error);
    }
  }

  function stopPreview(): void {
    if (audioElement) {
      audioElement.pause();
      audioElement = null;
    }
    currentlyPlaying = null;
  }

  function toggleInclusion(index: number): void {
    selections[index].included = !selections[index].included;
    notifySelectionChange();
  }

  function selectAlternative(index: number, track: SpotifyTrack): void {
    selections[index].selectedTrack = track;
    notifySelectionChange();
  }

  function notifySelectionChange(): void {
    // Get all selected tracks
    const selectedTracks = Object.entries(selections)
      .filter(([_, sel]) => sel.included && sel.selectedTrack)
      .map(([_, sel]) => sel.selectedTrack) as SpotifyTrack[];

    dispatch('selectionChange', { selectedTracks });
  }

  function getConfidenceColor(confidence?: number): string {
    if (!confidence) return 'low';
    if (confidence >= 80) return 'high';
    if (confidence >= 60) return 'medium';
    return 'low';
  }

  function getConfidenceLabel(confidence?: number): string {
    if (!confidence) return 'Fair';
    if (confidence >= 80) return 'Excellent';
    if (confidence >= 60) return 'Good';
    return 'Fair';
  }
</script>

<div class="results-container">
  <div class="summary">
    <div class="stat">
      <span class="stat-value">{results.length}</span>
      <span class="stat-label">Total Songs</span>
    </div>
    <div class="stat">
      <span class="stat-value success">{results.filter(r => r.tracks.length > 0).length}</span>
      <span class="stat-label">Found</span>
    </div>
    <div class="stat">
      <span class="stat-value" style="color: var(--accent-gold)">
        {Object.values(selections).filter(s => s?.included).length}
      </span>
      <span class="stat-label">Selected</span>
    </div>
    <div class="stat">
      <span class="stat-value error">{results.filter(r => r.tracks.length === 0).length}</span>
      <span class="stat-label">Not Found</span>
    </div>
  </div>

  <div class="results-list">
    {#each results as result, index}
      {@const firstTrack = result.tracks.length > 0 ? result.tracks[0] : null}
      {@const otherTracks = result.tracks.slice(1)}
      <div class="result-item {firstTrack ? 'found' : 'not-found'} {selections[index]?.included ? 'included' : 'excluded'}">
        <div class="result-header">
          <span class="result-number">{index + 1}</span>
          <span class="query">{result.query}</span>
          {#if firstTrack}
            <span class="confidence {getConfidenceColor(result.confidence)}">
              {result.confidence ? `${result.confidence}%` : 'N/A'} ({getConfidenceLabel(result.confidence)})
            </span>
            <label class="checkbox-container">
              <input
                type="checkbox"
                checked={selections[index]?.included}
                on:change={() => toggleInclusion(index)}
              />
              <span class="checkbox-label">Include</span>
            </label>
          {:else}
            <span class="not-found-label">❌ Not Found</span>
          {/if}
        </div>

        {#if firstTrack && selections[index]?.included}
          <div class="match-selection">
            <label class="match-option {selections[index]?.selectedTrack === firstTrack ? 'selected' : ''}">
              <input
                type="radio"
                name="track-{index}"
                checked={selections[index]?.selectedTrack === firstTrack}
                on:change={() => selectAlternative(index, firstTrack)}
              />
              <div class="match-info">
                {#if firstTrack.album.images.length > 0}
                  <img src={firstTrack.album.images[0].url} alt={firstTrack.album.name} class="album-art" />
                {/if}
                <div class="track-details">
                  <p class="track-name">
                    {firstTrack.name}
                    <span class="best-match-badge">Best Match</span>
                  </p>
                  <p class="track-artists">{firstTrack.artists.map(a => a.name).join(', ')}</p>
                  <p class="track-album">{firstTrack.album.name}</p>
                </div>
                <!-- Preview player disabled - not available in Spotify Development Mode
                {#if result.bestMatch.previewUrl}
                  <button
                    class="play-button"
                    on:click|stopPropagation={() => playPreview(result.bestMatch.previewUrl, result.bestMatch.id)}
                    title="Play preview"
                  >
                    {#if currentlyPlaying === result.bestMatch.id}
                      <span class="icon">⏸</span>
                    {:else}
                      <span class="icon">▶</span>
                    {/if}
                  </button>
                {:else}
                  <div class="no-preview" title="No preview available">
                    <span class="icon">🔇</span>
                  </div>
                {/if}
                -->
              </div>
            </label>

            {#if otherTracks.length > 0}
              <div class="alternatives-section">
                <p class="alternatives-header">Or choose an alternative:</p>
                {#each otherTracks as alt}
                  <label class="match-option alternative {selections[index]?.selectedTrack === alt ? 'selected' : ''}">
                    <input
                      type="radio"
                      name="track-{index}"
                      checked={selections[index]?.selectedTrack === alt}
                      on:change={() => selectAlternative(index, alt)}
                    />
                    <div class="match-info compact">
                      <div class="track-details">
                        <p class="track-name">{alt.name}</p>
                        <p class="track-artists">{alt.artists.map(a => a.name).join(', ')}</p>
                      </div>
                      <!-- Preview player disabled - not available in Spotify Development Mode
                      {#if alt.previewUrl}
                        <button
                          class="play-button small"
                          on:click|stopPropagation={() => playPreview(alt.previewUrl, alt.id)}
                          title="Play preview"
                        >
                          {#if currentlyPlaying === alt.id}
                            <span class="icon">⏸</span>
                          {:else}
                            <span class="icon">▶</span>
                          {/if}
                        </button>
                      {:else}
                        <div class="no-preview small" title="No preview available">
                          <span class="icon">🔇</span>
                        </div>
                      {/if}
                      -->
                    </div>
                  </label>
                {/each}
              </div>
            {/if}
          </div>
        {/if}
      </div>
    {/each}
  </div>
</div>

<style>
  .results-container {
    margin: 1.5rem 0;
  }

  .summary {
    display: flex;
    gap: 1.5rem;
    margin-bottom: 1.5rem;
    justify-content: center;
  }

  .stat {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 1rem;
    background: var(--bg-secondary);
    border-radius: 8px;
    min-width: 100px;
  }

  .stat-value {
    font-size: 2rem;
    font-weight: 700;
    font-family: var(--font-heading);
    color: var(--accent-gold);
  }

  .stat-value.success {
    color: var(--christmas-green);
  }

  .stat-value.error {
    color: var(--christmas-red);
  }

  .stat-label {
    font-size: 0.85rem;
    color: var(--text-secondary);
    margin-top: 0.25rem;
  }

  .results-list {
    max-height: 500px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .result-item {
    padding: 1rem;
    background: var(--bg-secondary);
    border-radius: 8px;
    border-left: 4px solid transparent;
  }

  .result-item.found {
    border-left-color: var(--christmas-green);
  }

  .result-item.not-found {
    border-left-color: var(--christmas-red);
    opacity: 0.7;
  }

  .result-item.excluded {
    opacity: 0.5;
  }

  .result-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 0.75rem;
    flex-wrap: wrap;
  }

  .checkbox-container {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    padding: 0.25rem 0.75rem;
    border-radius: 4px;
    background: var(--christmas-green);
    color: white;
    font-size: 0.85rem;
    font-weight: 600;
    transition: opacity 0.2s;
  }

  .checkbox-container:hover {
    opacity: 0.9;
  }

  .checkbox-container input[type="checkbox"] {
    cursor: pointer;
    width: 16px;
    height: 16px;
  }

  .checkbox-label {
    user-select: none;
  }

  .match-selection {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .match-option {
    cursor: pointer;
    display: block;
    padding: 0.75rem;
    background: var(--bg-card);
    border-radius: 6px;
    border: 2px solid transparent;
    transition: all 0.2s;
  }

  .match-option:hover {
    border-color: var(--accent-gold);
  }

  .match-option.selected {
    border-color: var(--christmas-green);
    background: rgba(22, 91, 51, 0.1);
  }

  .match-option input[type="radio"] {
    float: left;
    margin-right: 0.75rem;
    margin-top: 0.5rem;
    cursor: pointer;
    width: 18px;
    height: 18px;
  }

  .best-match-badge {
    display: inline-block;
    font-size: 0.75rem;
    padding: 0.15rem 0.5rem;
    background: var(--accent-gold);
    color: var(--bg-primary);
    border-radius: 3px;
    margin-left: 0.5rem;
    font-weight: 700;
  }

  .alternatives-section {
    margin-top: 0.5rem;
    padding: 0.75rem;
    background: var(--bg-secondary);
    border-radius: 6px;
  }

  .alternatives-header {
    font-size: 0.9rem;
    color: var(--text-secondary);
    margin-bottom: 0.75rem;
    font-weight: 500;
  }

  .match-option.alternative {
    margin-bottom: 0.5rem;
  }

  .match-option.alternative:last-child {
    margin-bottom: 0;
  }

  .match-info.compact {
    padding: 0;
  }

  .match-info.compact .track-details {
    padding-left: 0;
  }

  .play-button {
    flex-shrink: 0;
    width: 48px;
    height: 48px;
    border-radius: 50%;
    border: none;
    background: var(--christmas-green);
    color: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    margin-left: auto;
  }

  .play-button:hover {
    background: var(--christmas-light-green);
    transform: scale(1.1);
  }

  .play-button:active {
    transform: scale(0.95);
  }

  .play-button.small {
    width: 36px;
    height: 36px;
  }

  .play-button .icon {
    font-size: 1.2rem;
    line-height: 1;
  }

  .play-button.small .icon {
    font-size: 1rem;
  }

  .no-preview {
    flex-shrink: 0;
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: var(--bg-secondary);
    color: var(--text-secondary);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-left: auto;
    opacity: 0.5;
  }

  .no-preview.small {
    width: 36px;
    height: 36px;
  }

  .no-preview .icon {
    font-size: 1.2rem;
    line-height: 1;
  }

  .no-preview.small .icon {
    font-size: 1rem;
  }

  .result-number {
    background: var(--accent-gold);
    color: var(--bg-primary);
    font-weight: 700;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.85rem;
    flex-shrink: 0;
  }

  .query {
    flex: 1;
    font-weight: 500;
    color: var(--text-primary);
  }

  .confidence {
    padding: 0.25rem 0.75rem;
    border-radius: 4px;
    font-size: 0.85rem;
    font-weight: 600;
  }

  .confidence.high {
    background: var(--christmas-green);
    color: white;
  }

  .confidence.medium {
    background: var(--christmas-gold);
    color: var(--bg-primary);
  }

  .confidence.low {
    background: var(--christmas-light-red);
    color: white;
  }

  .not-found-label {
    color: var(--christmas-red);
    font-weight: 600;
    font-size: 0.9rem;
  }

  .match-info {
    display: flex;
    gap: 1rem;
    padding: 0.75rem;
    background: var(--bg-card);
    border-radius: 6px;
  }

  .album-art {
    width: 64px;
    height: 64px;
    border-radius: 4px;
    flex-shrink: 0;
  }

  .track-details {
    flex: 1;
  }

  .track-name {
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 0.25rem;
  }

  .track-artists {
    color: var(--text-secondary);
    font-size: 0.9rem;
    margin-bottom: 0.25rem;
  }

  .track-album {
    color: var(--text-secondary);
    font-size: 0.85rem;
    font-style: italic;
  }

  .alternatives {
    margin-top: 0.75rem;
  }

  .alternatives summary {
    cursor: pointer;
    color: var(--accent-gold);
    font-size: 0.9rem;
    padding: 0.5rem;
    border-radius: 4px;
    transition: background 0.2s;
  }

  .alternatives summary:hover {
    background: var(--bg-card);
  }

  .alternatives-list {
    margin-top: 0.5rem;
    padding-left: 1rem;
  }

  .alternative-item {
    padding: 0.5rem;
    border-left: 2px solid var(--border-color);
    margin-bottom: 0.5rem;
  }

  .alt-name {
    font-weight: 500;
    color: var(--text-primary);
    font-size: 0.9rem;
  }

  .alt-artists {
    color: var(--text-secondary);
    font-size: 0.85rem;
  }

  @media (max-width: 768px) {
    .summary {
      gap: 0.75rem;
    }

    .stat {
      min-width: 80px;
      padding: 0.75rem;
    }

    .stat-value {
      font-size: 1.5rem;
    }

    .match-info {
      flex-direction: column;
    }

    .album-art {
      width: 100%;
      height: auto;
    }
  }
</style>
