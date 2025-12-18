<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { slide } from 'svelte/transition';
  import type { SpotifyTrack } from '../types/api';

  export let playlistName: string = 'My Playlist';
  export let songs: Array<{
    id: string;
    title: string;
    artist: string;
    confidence: number;
    uri: string;
    alternatives: Array<{
      id: string;
      title: string;
      artist: string;
      confidence: number;
      uri: string;
    }>;
  }> = [];
  export let existingPlaylists: Array<{
    id: string;
    name: string;
    tracks?: { total: number };
  }> = [];

  const dispatch = createEventDispatcher<{
    playlistNameChange: { name: string };
    upload: { selectedTracks: string[]; playlistId?: string };
  }>();

  let playlistMode: 'new' | 'existing' = 'new';
  let selectedPlaylistId: string = '';

  interface SongSelection {
    included: boolean;
    selectedUri: string; // URI of selected track (main or alternative)
    expanded: boolean;
  }

  let selections: Record<string, SongSelection> = {};
  let allSelected: boolean = true;

  // Initialize selections when songs change
  $: {
    if (songs.length > 0) {
      songs.forEach(song => {
        if (!selections[song.id]) {
          selections[song.id] = {
            included: true,
            selectedUri: song.uri,
            expanded: false
          };
        }
      });
    }
  }

  // Update allSelected state
  $: {
    const includedCount = Object.values(selections).filter(s => s.included).length;
    allSelected = includedCount === songs.length && songs.length > 0;
  }

  function toggleExpanded(songId: string): void {
    selections[songId].expanded = !selections[songId].expanded;
  }

  function toggleInclusion(songId: string): void {
    selections[songId].included = !selections[songId].included;
  }

  function selectAlternative(songId: string, uri: string): void {
    selections[songId].selectedUri = uri;
  }

  function toggleSelectAll(): void {
    const newState = !allSelected;
    songs.forEach(song => {
      selections[song.id].included = newState;
    });
  }

  function handlePlaylistNameChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    dispatch('playlistNameChange', { name: target.value });
  }

  function handleUpload(): void {
    const selectedTracks = songs
      .filter(song => selections[song.id]?.included)
      .map(song => selections[song.id].selectedUri);

    if (playlistMode === 'existing') {
      dispatch('upload', { selectedTracks, playlistId: selectedPlaylistId });
    } else {
      dispatch('upload', { selectedTracks });
    }
  }

  function getConfidenceColor(confidence: number): string {
    if (confidence >= 80) return 'high';
    if (confidence >= 60) return 'medium';
    return 'low';
  }
</script>

<div class="compact-song-list">
  <div class="playlist-header">
    <div class="playlist-mode-toggle">
      <button
        class="mode-button {playlistMode === 'new' ? 'active' : ''}"
        on:click={() => playlistMode = 'new'}
        type="button"
      >
        Create New
      </button>
      <button
        class="mode-button {playlistMode === 'existing' ? 'active' : ''}"
        on:click={() => playlistMode = 'existing'}
        type="button"
      >
        Add to Existing
      </button>
    </div>

    {#if playlistMode === 'new'}
      <input
        id="playlist-name"
        type="text"
        bind:value={playlistName}
        on:input={handlePlaylistNameChange}
        class="playlist-name-input"
        placeholder="My Awesome Playlist"
      />
    {:else}
      <select
        bind:value={selectedPlaylistId}
        class="playlist-select"
      >
        <option value="" disabled>Select a playlist...</option>
        {#each existingPlaylists as playlist}
          <option value={playlist.id}>
            {playlist.name}
            {#if playlist.tracks?.total !== undefined}
              ({playlist.tracks.total} tracks)
            {/if}
          </option>
        {/each}
      </select>
    {/if}
  </div>

  <div class="list-controls">
    <button class="control-button" on:click={toggleSelectAll} type="button">
      {allSelected ? 'Deselect All' : 'Select All'}
    </button>
    <span class="track-count">
      {Object.values(selections).filter(s => s.included).length} of {songs.length} selected
    </span>
  </div>

  <div class="song-list">
    {#each songs as song (song.id)}
      <div class="song-item {selections[song.id]?.included ? 'included' : 'excluded'}">
        <div class="song-row" on:click={() => toggleExpanded(song.id)}>
          <label class="checkbox-wrapper" on:click|stopPropagation>
            <input
              type="checkbox"
              checked={selections[song.id]?.included}
              on:change={() => toggleInclusion(song.id)}
            />
          </label>
          <span class="music-icon">♫</span>
          <span class="song-info">
            <span class="song-artist">{song.artist}</span>
            <span class="separator">-</span>
            <span class="song-title">{song.title}</span>
          </span>
          <span class="confidence-badge {getConfidenceColor(song.confidence)}">
            {song.confidence}%
          </span>
          {#if song.alternatives.length > 0}
            <button
              class="expand-button"
              on:click|stopPropagation={() => toggleExpanded(song.id)}
              type="button"
              aria-label="Show alternatives"
            >
              {selections[song.id]?.expanded ? '▲' : '▼'}
            </button>
          {/if}
        </div>

        {#if selections[song.id]?.expanded && song.alternatives.length > 0}
          <div class="alternatives-panel" transition:slide={{ duration: 200 }}>
            <div class="alternative-item">
              <label class="alternative-label">
                <input
                  type="radio"
                  name="alt-{song.id}"
                  checked={selections[song.id]?.selectedUri === song.uri}
                  on:change={() => selectAlternative(song.id, song.uri)}
                />
                <span class="alternative-info">
                  <span class="alternative-text">● {song.artist} - {song.title}</span>
                  <span class="confidence-text {getConfidenceColor(song.confidence)}">
                    ({song.confidence}% match)
                  </span>
                </span>
              </label>
            </div>
            {#each song.alternatives as alt}
              <div class="alternative-item">
                <label class="alternative-label">
                  <input
                    type="radio"
                    name="alt-{song.id}"
                    checked={selections[song.id]?.selectedUri === alt.uri}
                    on:change={() => selectAlternative(song.id, alt.uri)}
                  />
                  <span class="alternative-info">
                    <span class="alternative-text">○ {alt.artist} - {alt.title}</span>
                    <span class="confidence-text {getConfidenceColor(alt.confidence)}">
                      ({alt.confidence}% match)
                    </span>
                  </span>
                </label>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    {/each}
  </div>

  <div class="upload-section">
    <button
      class="upload-button"
      on:click={handleUpload}
      disabled={Object.values(selections).filter(s => s.included).length === 0 || (playlistMode === 'existing' && !selectedPlaylistId)}
      type="button"
    >
      {playlistMode === 'existing' ? 'Add to Playlist' : 'Upload to Spotify'}
    </button>
  </div>
</div>

<style>
  .compact-song-list {
    background: var(--bg-card);
    border-radius: 12px;
    padding: 1.5rem;
    margin-top: 2rem;
  }

  .playlist-header {
    margin-bottom: 1.5rem;
  }

  .playlist-mode-toggle {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .mode-button {
    flex: 1;
    padding: 0.5rem 1rem;
    background: var(--bg-secondary);
    border: 2px solid var(--border);
    border-radius: 6px;
    color: var(--text-secondary);
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .mode-button:hover {
    border-color: var(--christmas-green);
    color: var(--text-primary);
  }

  .mode-button.active {
    background: var(--christmas-green);
    border-color: var(--christmas-green);
    color: white;
  }

  .playlist-name-input,
  .playlist-select {
    width: 100%;
    padding: 0.75rem 1rem;
    font-size: 1.1rem;
    font-weight: 600;
    border: 2px solid var(--border);
    border-radius: 8px;
    background: var(--bg-secondary);
    color: var(--text-primary);
    transition: border-color 0.2s;
  }

  .playlist-name-input:focus,
  .playlist-select:focus {
    outline: none;
    border-color: var(--christmas-green);
    box-shadow: 0 0 0 3px rgba(22, 91, 51, 0.1);
  }

  .playlist-select {
    cursor: pointer;
  }

  .list-controls {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    padding-bottom: 0.75rem;
    border-bottom: 2px solid var(--bg-secondary);
  }

  .control-button {
    padding: 0.5rem 1rem;
    background: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: 6px;
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--text-primary);
    cursor: pointer;
    transition: all 0.2s;
  }

  .control-button:hover {
    background: var(--bg-card);
    border-color: var(--accent);
  }

  .track-count {
    font-size: 0.9rem;
    color: var(--text-secondary);
    font-weight: 500;
  }

  .song-list {
    max-height: 400px;
    overflow-y: auto;
    margin-bottom: 1.5rem;
  }

  .song-item {
    border-bottom: 1px solid var(--bg-secondary);
    transition: opacity 0.3s ease, transform 0.2s ease;
  }

  .song-item:last-child {
    border-bottom: none;
  }

  .song-item.excluded {
    opacity: 0.4;
  }

  .song-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 0.5rem;
    cursor: pointer;
    transition: background 0.2s ease, transform 0.1s ease;
  }

  .song-row:hover {
    background: var(--bg-secondary);
    transform: translateX(4px);
  }

  .song-row:active {
    transform: translateX(2px);
  }

  .checkbox-wrapper {
    display: flex;
    align-items: center;
    cursor: pointer;
  }

  .checkbox-wrapper input[type="checkbox"] {
    width: 18px;
    height: 18px;
    cursor: pointer;
  }

  .music-icon {
    font-size: 1.2rem;
    color: var(--accent);
    flex-shrink: 0;
  }

  .song-info {
    flex: 1;
    font-size: 0.95rem;
    color: var(--text-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .song-artist {
    font-weight: 600;
  }

  .separator {
    margin: 0 0.5rem;
    color: var(--text-secondary);
  }

  .song-title {
    font-weight: 500;
  }

  .confidence-badge {
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.8rem;
    font-weight: 700;
    flex-shrink: 0;
  }

  .confidence-badge.high {
    background: var(--christmas-green);
    color: white;
  }

  .confidence-badge.medium {
    background: var(--christmas-gold);
    color: var(--bg-primary);
  }

  .confidence-badge.low {
    background: var(--christmas-red);
    color: white;
  }

  .expand-button {
    width: 32px;
    height: 32px;
    border: none;
    background: var(--bg-secondary);
    color: var(--text-primary);
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.8rem;
    transition: all 0.2s;
    flex-shrink: 0;
  }

  .expand-button:hover {
    background: var(--accent);
    color: white;
  }

  .alternatives-panel {
    padding: 1rem 1rem 1rem 3rem;
    background: var(--bg-secondary);
    border-top: 1px solid var(--border);
  }

  .alternative-item {
    margin-bottom: 0.75rem;
  }

  .alternative-item:last-child {
    margin-bottom: 0;
  }

  .alternative-label {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    cursor: pointer;
    padding: 0.5rem;
    border-radius: 4px;
    transition: background 0.2s;
  }

  .alternative-label:hover {
    background: var(--bg-card);
  }

  .alternative-label input[type="radio"] {
    margin-top: 0.25rem;
    cursor: pointer;
    flex-shrink: 0;
  }

  .alternative-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .alternative-text {
    font-size: 0.9rem;
    color: var(--text-primary);
    font-weight: 500;
  }

  .confidence-text {
    font-size: 0.8rem;
    font-weight: 600;
  }

  .confidence-text.high {
    color: var(--christmas-green);
  }

  .confidence-text.medium {
    color: var(--christmas-gold);
  }

  .confidence-text.low {
    color: var(--christmas-red);
  }

  .upload-section {
    display: flex;
    justify-content: center;
    padding-top: 1rem;
    border-top: 2px solid var(--bg-secondary);
  }

  .upload-button {
    padding: 1rem 3rem;
    background: linear-gradient(135deg, #1db954 0%, #1ed760 100%);
    color: white;
    border: none;
    border-radius: 50px;
    font-size: 1.1rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 15px rgba(29, 185, 84, 0.3);
  }

  .upload-button:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(29, 185, 84, 0.4);
  }

  .upload-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }

  @media (max-width: 768px) {
    .song-info {
      font-size: 0.85rem;
    }

    .song-row {
      gap: 0.5rem;
    }

    .confidence-badge {
      font-size: 0.7rem;
      padding: 0.2rem 0.4rem;
    }

    .alternatives-panel {
      padding-left: 2rem;
    }
  }
</style>
