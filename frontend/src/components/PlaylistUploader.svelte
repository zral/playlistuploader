<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { fade, slide } from 'svelte/transition';
  import { search, playlists } from '../lib/api';
  import type { UserResponse, SpotifyPlaylist, SpotifyTrack, SearchResult } from '../types/api';
  import CompactSongList from './CompactSongList.svelte';
  import AIPlaylistGenerator from './AIPlaylistGenerator.svelte';

  export let user: UserResponse;

  const dispatch = createEventDispatcher<{
    notification: { message: string; type: 'info' | 'success' | 'error' };
  }>();

  let playlistText: string = '';
  let userPlaylists: SpotifyPlaylist[] = [];
  let selectedPlaylist: string = '';
  let newPlaylistName: string = 'My Playlist';
  let searchResults: SearchResult[] = [];
  let selectedTracks: SpotifyTrack[] = []; // Tracks selected by user
  let loading: boolean = false;
  let step: 1 | 2 | 3 = 1; // 1: input, 2: results, 3: uploading
  let progress: { current: number; total: number } = { current: 0, total: 0 };
  let inputMode: 'text' | 'file' = 'text';
  let uploadedFile: File | null = null;
  let showManualEntry: boolean = false;
  let compactSongs: Array<{
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

  function handleSelectionChange(event: CustomEvent<{ selectedTracks: SpotifyTrack[] }>): void {
    selectedTracks = event.detail.selectedTracks;
  }

  function handleFileUpload(event: Event): void {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      dispatch('notification', {
        message: 'Please upload a CSV file',
        type: 'error',
      });
      return;
    }

    uploadedFile = file;
    parseCSV(file);
  }

  function parseCSV(file: File): void {
    const reader = new FileReader();

    reader.onload = (e: ProgressEvent<FileReader>): void => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());

        if (lines.length === 0) {
          throw new Error('CSV file is empty');
        }

        // Detect header line (skip "Shazam Library" title if present)
        let headerLineIndex = 0;
        let headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));

        // Check if first line has Title/Artist columns
        const hasValidHeaders = headers.some(h =>
          ['title', 'song', 'track', 'artist', 'artistname'].includes(h.toLowerCase())
        );

        // If first line doesn't have valid headers, try second line (Shazam format)
        if (!hasValidHeaders && lines.length > 1) {
          headerLineIndex = 1;
          headers = lines[1].split(',').map(h => h.trim().replace(/"/g, ''));
        }

        // Find Title and Artist columns (case-insensitive)
        const titleIndex = headers.findIndex(h =>
          h.toLowerCase() === 'title' || h.toLowerCase() === 'song' || h.toLowerCase() === 'track'
        );
        const artistIndex = headers.findIndex(h =>
          h.toLowerCase() === 'artist' || h.toLowerCase() === 'artistname'
        );

        if (titleIndex === -1 || artistIndex === -1) {
          throw new Error('CSV must have "Title" and "Artist" columns');
        }

        // Parse songs (start from line after header)
        const songs: string[] = [];
        for (let i = headerLineIndex + 1; i < lines.length; i++) {
          const values = parseCSVLine(lines[i]);
          if (values.length > Math.max(titleIndex, artistIndex)) {
            const title = values[titleIndex]?.trim();
            const artist = values[artistIndex]?.trim();
            if (title && artist) {
              songs.push(`${artist} - ${title}`);
            }
          }
        }

        if (songs.length === 0) {
          throw new Error('No valid songs found in CSV');
        }

        playlistText = songs.join('\n');
        dispatch('notification', {
          message: `Loaded ${songs.length} songs from CSV`,
          type: 'success',
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to parse CSV file';
        dispatch('notification', {
          message: errorMessage,
          type: 'error',
        });
        uploadedFile = null;
      }
    };

    reader.onerror = (): void => {
      dispatch('notification', {
        message: 'Failed to read file',
        type: 'error',
      });
      uploadedFile = null;
    };

    reader.readAsText(file);
  }

  // Simple CSV line parser that handles quoted values
  function parseCSVLine(line: string): string[] {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    values.push(current.trim());
    return values.map(v => v.replace(/^"|"$/g, '')); // Remove surrounding quotes
  }

  onMount(async () => {
    await loadPlaylists();
  });

  async function loadPlaylists(): Promise<void> {
    try {
      const data = await playlists.getAll();
      userPlaylists = data.playlists;
    } catch (error) {
      dispatch('notification', {
        message: 'Failed to load playlists',
        type: 'error',
      });
    }
  }

  async function handleSearch(): Promise<void> {
    if (!playlistText.trim()) {
      dispatch('notification', {
        message: 'Please enter some songs',
        type: 'error',
      });
      return;
    }

    loading = true;
    step = 2;

    try {
      // Parse songs (one per line)
      const songs = playlistText
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);

      if (songs.length === 0) {
        throw new Error('No valid songs found');
      }

      if (songs.length > 100) {
        throw new Error('Maximum 100 songs allowed at once');
      }

      progress = { current: 0, total: songs.length };

      // Batch search
      const data = await search.batch(songs);

      // Transform backend response to match SearchResult interface
      searchResults = data.results.map((result: any) => {
        const tracks: SpotifyTrack[] = [];

        // Add bestMatch as first track if it exists
        if (result.bestMatch) {
          tracks.push({
            id: result.bestMatch.id,
            uri: result.bestMatch.uri,
            name: result.bestMatch.name,
            artists: result.bestMatch.artists.map((name: string) => ({ name })),
            album: { name: result.bestMatch.album, images: result.bestMatch.albumImage ? [{ url: result.bestMatch.albumImage }] : [] },
            preview_url: result.bestMatch.previewUrl || null,
          });
        }

        // Add alternatives as additional tracks
        if (result.alternatives) {
          result.alternatives.forEach((alt: any) => {
            tracks.push({
              id: alt.id,
              uri: alt.uri,
              name: alt.name,
              artists: alt.artists.map((name: string) => ({ name })),
              album: { name: alt.album, images: [] },
              preview_url: alt.previewUrl || null,
            });
          });
        }

        return {
          query: result.query,
          tracks: tracks,
          confidence: result.bestMatch?.confidence,
          selected: tracks.length > 0,
          selectedTrack: tracks[0] || undefined,
        };
      });

      // Transform search results to compact format
      compactSongs = searchResults
        .filter(r => r.tracks && r.tracks.length > 0)
        .map(r => ({
          id: r.tracks[0].id,
          title: r.tracks[0].name,
          artist: r.tracks[0].artists.map(a => a.name).join(', '),
          confidence: r.confidence || 0,
          uri: r.tracks[0].uri,
          alternatives: r.tracks.slice(1, 3).map(alt => ({
            id: alt.id,
            title: alt.name,
            artist: alt.artists.map(a => a.name).join(', '),
            confidence: Math.max(0, (r.confidence || 0) - 10), // Slightly lower confidence for alternatives
            uri: alt.uri
          }))
        }));

      dispatch('notification', {
        message: `Found matches for ${compactSongs.length} out of ${songs.length} songs`,
        type: 'success',
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Search failed';
      dispatch('notification', {
        message: errorMessage,
        type: 'error',
      });
      step = 1;
    } finally {
      loading = false;
    }
  }

  function handleCompactListUpload(event: CustomEvent<{ selectedTracks: string[]; playlistId?: string }>): void {
    handleUploadWithUris(event.detail.selectedTracks, event.detail.playlistId);
  }

  async function handleUploadWithUris(trackUris: string[], existingPlaylistId?: string): Promise<void> {
    if (trackUris.length === 0) {
      dispatch('notification', {
        message: 'No tracks selected. Please select at least one track to add.',
        type: 'error',
      });
      return;
    }

    loading = true;
    step = 3;

    try {
      let playlistId: string;
      let playlistNameForMessage: string;

      if (existingPlaylistId) {
        // Adding to existing playlist
        playlistId = existingPlaylistId;
        const existingPlaylist = userPlaylists.find(p => p.id === existingPlaylistId);
        playlistNameForMessage = existingPlaylist?.name || 'playlist';
      } else {
        // Create new playlist
        const data = await playlists.create(
          newPlaylistName.trim(),
          `Created with Spotify Playlist Uploader on ${new Date().toLocaleDateString()}`
        );
        playlistId = data.playlist.id;
        playlistNameForMessage = newPlaylistName;
      }

      // Add tracks to playlist
      await playlists.addTracks(playlistId, trackUris);

      dispatch('notification', {
        message: `Successfully added ${trackUris.length} tracks to "${playlistNameForMessage}"!`,
        type: 'success',
      });

      // Reset
      resetForm();
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Upload failed';
      dispatch('notification', {
        message: errorMessage,
        type: 'error',
      });
      step = 2;
    } finally {
      loading = false;
    }
  }

  async function handleUpload(): Promise<void> {
    if (!selectedPlaylist && !newPlaylistName.trim()) {
      dispatch('notification', {
        message: 'Please select or create a playlist',
        type: 'error',
      });
      return;
    }

    loading = true;
    step = 3;

    try {
      let playlistId = selectedPlaylist;

      // Create new playlist if needed
      if (!selectedPlaylist && newPlaylistName.trim()) {
        const data = await playlists.create(
          newPlaylistName.trim(),
          `Created with Christmas Playlist Uploader on ${new Date().toLocaleDateString()}`
        );
        playlistId = data.playlist.id;
      }

      // Get track URIs from selected tracks
      const trackUris = selectedTracks.map(track => track.uri);

      if (trackUris.length === 0) {
        throw new Error('No tracks selected. Please select at least one track to add.');
      }

      // Add tracks to playlist
      await playlists.addTracks(playlistId, trackUris);

      dispatch('notification', {
        message: `Successfully added ${trackUris.length} tracks to playlist!`,
        type: 'success',
      });

      // Reset
      resetForm();
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Upload failed';
      dispatch('notification', {
        message: errorMessage,
        type: 'error',
      });
      step = 2;
    } finally {
      loading = false;
    }
  }

  function handlePlaylistNameChange(event: CustomEvent<{ name: string }>): void {
    newPlaylistName = event.detail.name;
  }

  function resetForm(): void {
    playlistText = '';
    searchResults = [];
    compactSongs = [];
    selectedTracks = [];
    selectedPlaylist = '';
    newPlaylistName = 'My Playlist';
    step = 1;
    progress = { current: 0, total: 0 };
    showManualEntry = false;
  }

  function goBack(): void {
    step = 1;
    searchResults = [];
  }

  function handleAIGenerate(generatedPlaylist: string, suggestedName: string): void {
    playlistText = generatedPlaylist;
    newPlaylistName = suggestedName; // Use AI-suggested playlist name
    inputMode = 'text'; // Switch to text mode to show the generated playlist

    // Automatically search and show review pane
    setTimeout(() => {
      handleSearch();
    }, 100);
  }
</script>

<div class="uploader">
  <!-- AI Playlist Generator - Always Visible -->
  <AIPlaylistGenerator
    onGenerate={handleAIGenerate}
    on:notification
  />

  <!-- Compact Song List - Shows after AI generation or manual search -->
  {#if step === 2 && compactSongs.length > 0}
    <div class="review-section" transition:slide={{ duration: 300 }}>
      <h2 class="review-title">Review Your Playlist</h2>
      <p class="review-subtitle">
        ✓ {compactSongs.length} tracks found • Tap any song to see alternatives
      </p>

      <CompactSongList
        bind:playlistName={newPlaylistName}
        songs={compactSongs}
        existingPlaylists={userPlaylists}
        on:playlistNameChange={handlePlaylistNameChange}
        on:upload={handleCompactListUpload}
      />
    </div>
  {:else if step === 1}
    <!-- Manual Entry Section - Hidden by default -->
    {#if !showManualEntry}
      <div class="manual-bypass" transition:fade={{ duration: 200 }}>
        <button class="bypass-link" on:click={() => showManualEntry = true} type="button">
          or start from scratch
        </button>
      </div>
    {/if}

    {#if showManualEntry}
      <!-- Input Step -->
      <div class="card" transition:slide={{ duration: 300 }}>
        <h2>📝 Build Your Playlist</h2>

      <!-- Input mode tabs -->
      <div class="input-tabs">
        <button
          class="tab {inputMode === 'text' ? 'active' : ''}"
          on:click={() => inputMode = 'text'}
        >
          📝 Text Input
        </button>
        <button
          class="tab {inputMode === 'file' ? 'active' : ''}"
          on:click={() => inputMode = 'file'}
        >
          📄 Upload CSV
        </button>
      </div>

      {#if inputMode === 'text'}
        <p class="instruction">Enter one song per line. Format: "Artist - Song" or just "Song Name"</p>

        <textarea
          id="playlist-textarea"
          bind:value={playlistText}
          placeholder="Example:&#10;Mariah Carey - All I Want for Christmas Is You&#10;Wham! - Last Christmas&#10;The Pogues - Fairytale of New York"
          rows="12"
        ></textarea>
      {:else}
        <p class="instruction">Upload a CSV file from Shazam or other music service with "Title" and "Artist" columns</p>

        <div class="file-upload-area">
          <input
            type="file"
            accept=".csv"
            on:change={handleFileUpload}
            id="csv-upload"
            style="display: none;"
          />
          <label for="csv-upload" class="file-upload-label">
            <span class="upload-icon">📁</span>
            <span class="upload-text">
              {#if uploadedFile}
                {uploadedFile.name}
              {:else}
                Click to upload CSV file
              {/if}
            </span>
            {#if uploadedFile}
              <span class="upload-success">✓</span>
            {/if}
          </label>
          {#if playlistText && inputMode === 'file'}
            <div class="preview-box">
              <p class="preview-label">Preview ({playlistText.split('\n').length} songs):</p>
              <div class="preview-content">{playlistText}</div>
            </div>
          {/if}
        </div>
      {/if}

      <div class="action-buttons">
        <button class="primary" on:click={handleSearch} disabled={loading || !playlistText.trim()}>
          {#if loading}
            <div class="spinner small"></div>
            Searching...
          {:else}
            🔍 Search Songs
          {/if}
        </button>
      </div>
    </div>
    {/if}
  {:else if step === 3}
    <!-- Uploading Step -->
    <div class="card uploading" transition:fade={{ duration: 200 }}>
      <div class="spinner-container">
        <div class="spinner"></div>
      </div>
      <h2>🎄 Adding tracks to your playlist...</h2>
      <p>This may take a moment</p>
      <div class="progress-dots">
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>
  {/if}
</div>

<style>
  .uploader {
    margin-top: 2rem;
  }

  .instruction {
    color: var(--text-secondary);
    margin-bottom: 1rem;
  }

  textarea {
    width: 100%;
    min-height: 200px;
    margin-bottom: 1.5rem;
    font-family: monospace;
    resize: vertical;
  }

  .action-buttons {
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
  }

  .action-buttons button {
    min-width: 150px;
  }

  .uploading {
    text-align: center;
    padding: 3rem;
    animation: fadeIn 0.3s ease;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .spinner-container {
    margin: 0 auto 2rem;
  }

  .uploading .spinner {
    margin: 0 auto;
  }

  .uploading h2 {
    margin-bottom: 0.5rem;
    animation: pulse 2s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.7;
    }
  }

  .uploading p {
    color: var(--text-secondary);
  }

  .progress-dots {
    display: flex;
    justify-content: center;
    gap: 0.5rem;
    margin-top: 1.5rem;
  }

  .progress-dots span {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--christmas-green);
    animation: bounce 1.4s ease-in-out infinite;
  }

  .progress-dots span:nth-child(1) {
    animation-delay: 0s;
  }

  .progress-dots span:nth-child(2) {
    animation-delay: 0.2s;
  }

  .progress-dots span:nth-child(3) {
    animation-delay: 0.4s;
  }

  @keyframes bounce {
    0%, 80%, 100% {
      transform: scale(0);
      opacity: 0.5;
    }
    40% {
      transform: scale(1);
      opacity: 1;
    }
  }

  .spinner.small {
    width: 20px;
    height: 20px;
    border-width: 2px;
  }

  /* CSV Import Tabs */
  .input-tabs {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1.5rem;
    border-bottom: 2px solid var(--bg-secondary);
  }

  .tab {
    padding: 0.75rem 1.5rem;
    background: transparent;
    border: none;
    border-bottom: 3px solid transparent;
    color: var(--text-secondary);
    cursor: pointer;
    font-size: 1rem;
    font-weight: 500;
    transition: all 0.2s;
    margin-bottom: -2px;
  }

  .tab:hover {
    color: var(--text-primary);
    background: var(--bg-secondary);
  }

  .tab.active {
    color: var(--christmas-green);
    border-bottom-color: var(--christmas-green);
    background: transparent;
  }

  /* File Upload Area */
  .file-upload-area {
    margin-bottom: 1.5rem;
  }

  .file-upload-label {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    padding: 3rem 2rem;
    background: var(--bg-secondary);
    border: 2px dashed var(--christmas-green);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s;
  }

  .file-upload-label:hover {
    background: var(--bg-card);
    border-color: var(--christmas-gold);
    transform: translateY(-2px);
  }

  .upload-icon {
    font-size: 2rem;
  }

  .upload-text {
    font-size: 1.1rem;
    color: var(--text-primary);
  }

  .upload-success {
    font-size: 1.5rem;
    color: var(--christmas-green);
  }

  /* CSV Preview */
  .preview-box {
    margin-top: 1.5rem;
    padding: 1rem;
    background: var(--bg-card);
    border-radius: 8px;
    border: 1px solid var(--bg-secondary);
  }

  .preview-label {
    font-weight: 600;
    color: var(--christmas-green);
    margin-bottom: 0.75rem;
  }

  .preview-content {
    max-height: 200px;
    overflow-y: auto;
    padding: 1rem;
    background: var(--bg-primary);
    border-radius: 4px;
    font-family: monospace;
    font-size: 0.9rem;
    line-height: 1.6;
    white-space: pre-wrap;
    word-wrap: break-word;
  }

  /* New Layout Styles */
  .review-section {
    margin-top: 2rem;
  }

  .review-title {
    text-align: center;
    color: var(--text-primary);
    font-size: 1.75rem;
    margin-bottom: 0.5rem;
  }

  .review-subtitle {
    text-align: center;
    color: var(--text-secondary);
    font-size: 1rem;
    margin-bottom: 1.5rem;
  }

  .manual-bypass {
    text-align: center;
    padding: 2rem 0;
  }

  .bypass-link {
    background: none;
    border: none;
    color: var(--text-secondary);
    font-size: 0.95rem;
    cursor: pointer;
    text-decoration: underline;
    padding: 0.5rem 1rem;
    transition: color 0.2s;
  }

  .bypass-link:hover {
    color: var(--accent);
  }

  @media (max-width: 768px) {
    .action-buttons {
      flex-direction: column;
    }

    .action-buttons button {
      width: 100%;
    }

    .input-tabs {
      flex-direction: column;
      border-bottom: none;
    }

    .tab {
      width: 100%;
      text-align: center;
      border-bottom: 2px solid var(--bg-secondary);
      margin-bottom: 0;
    }

    .tab.active {
      border-bottom-color: var(--christmas-green);
    }

    .file-upload-label {
      padding: 2rem 1rem;
      flex-direction: column;
    }

    .review-title {
      font-size: 1.5rem;
    }

    .review-subtitle {
      font-size: 0.9rem;
    }
  }
</style>
