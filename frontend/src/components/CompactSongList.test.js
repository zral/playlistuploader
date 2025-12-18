import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import CompactSongList from './CompactSongList.svelte';

describe('CompactSongList Component', () => {
  const mockSongs = [
    {
      id: 'track1',
      title: 'Song One',
      artist: 'Artist One',
      confidence: 95,
      uri: 'spotify:track:1',
      alternatives: [
        {
          id: 'track1alt1',
          title: 'Song One Alt',
          artist: 'Artist One',
          confidence: 85,
          uri: 'spotify:track:1alt1'
        }
      ]
    },
    {
      id: 'track2',
      title: 'Song Two',
      artist: 'Artist Two',
      confidence: 75,
      uri: 'spotify:track:2',
      alternatives: []
    },
    {
      id: 'track3',
      title: 'Song Three',
      artist: 'Artist Three',
      confidence: 55,
      uri: 'spotify:track:3',
      alternatives: [
        {
          id: 'track3alt1',
          title: 'Song Three Alt 1',
          artist: 'Artist Three',
          confidence: 45,
          uri: 'spotify:track:3alt1'
        },
        {
          id: 'track3alt2',
          title: 'Song Three Alt 2',
          artist: 'Artist Three',
          confidence: 40,
          uri: 'spotify:track:3alt2'
        }
      ]
    }
  ];

  test('renders playlist name input', () => {
    render(CompactSongList, {
      props: {
        playlistName: 'Test Playlist',
        songs: mockSongs
      }
    });

    const input = screen.getByDisplayValue('Test Playlist');
    expect(input).toBeInTheDocument();
  });

  test('displays all songs', () => {
    render(CompactSongList, {
      props: {
        playlistName: 'Test Playlist',
        songs: mockSongs
      }
    });

    expect(screen.getByText(/Artist One/)).toBeInTheDocument();
    expect(screen.getByText(/Song One/)).toBeInTheDocument();
    expect(screen.getByText(/Artist Two/)).toBeInTheDocument();
    expect(screen.getByText(/Song Two/)).toBeInTheDocument();
  });

  test('shows confidence badges with correct values', () => {
    render(CompactSongList, {
      props: {
        playlistName: 'Test Playlist',
        songs: mockSongs
      }
    });

    expect(screen.getByText('95%')).toBeInTheDocument();
    expect(screen.getByText('75%')).toBeInTheDocument();
    expect(screen.getByText('55%')).toBeInTheDocument();
  });

  test('shows select all/deselect all button', () => {
    render(CompactSongList, {
      props: {
        playlistName: 'Test Playlist',
        songs: mockSongs
      }
    });

    const button = screen.getByText(/Deselect All/);
    expect(button).toBeInTheDocument();
  });

  test('displays track count correctly', () => {
    render(CompactSongList, {
      props: {
        playlistName: 'Test Playlist',
        songs: mockSongs
      }
    });

    expect(screen.getByText(/3 of 3 selected/)).toBeInTheDocument();
  });

  test('shows expand button for songs with alternatives', () => {
    const { container } = render(CompactSongList, {
      props: {
        playlistName: 'Test Playlist',
        songs: mockSongs
      }
    });

    const expandButtons = container.querySelectorAll('.expand-button');
    // Song 1 and Song 3 have alternatives, Song 2 doesn't
    expect(expandButtons.length).toBe(2);
  });

  test('toggles song selection when checkbox is clicked', async () => {
    const { container } = render(CompactSongList, {
      props: {
        playlistName: 'Test Playlist',
        songs: mockSongs
      }
    });

    // Initially all songs are selected (3 of 3)
    expect(screen.getByText(/3 of 3 selected/)).toBeInTheDocument();

    // Click first checkbox to deselect
    const checkboxes = container.querySelectorAll('input[type="checkbox"]');
    await fireEvent.click(checkboxes[0]);

    // Should now show 2 of 3 selected
    expect(screen.getByText(/2 of 3 selected/)).toBeInTheDocument();
  });

  test('emits playlistNameChange event when name is edited', async () => {
    const { component } = render(CompactSongList, {
      props: {
        playlistName: 'Test Playlist',
        songs: mockSongs
      }
    });

    const playlistNameChangeSpy = vi.fn();
    component.$on('playlistNameChange', playlistNameChangeSpy);

    const input = screen.getByDisplayValue('Test Playlist');
    await fireEvent.input(input, { target: { value: 'New Name' } });

    expect(playlistNameChangeSpy).toHaveBeenCalled();
  });

  test('emits upload event with selected tracks when upload button clicked', async () => {
    const { component } = render(CompactSongList, {
      props: {
        playlistName: 'Test Playlist',
        songs: mockSongs
      }
    });

    const uploadSpy = vi.fn();
    component.$on('upload', uploadSpy);

    const uploadButton = screen.getByText(/Upload to Spotify/);
    await fireEvent.click(uploadButton);

    expect(uploadSpy).toHaveBeenCalled();
    // Should upload all 3 selected tracks
    const uploadEvent = uploadSpy.mock.calls[0][0];
    expect(uploadEvent.detail.selectedTracks).toHaveLength(3);
  });

  test('disables upload button when no tracks selected', async () => {
    const { container } = render(CompactSongList, {
      props: {
        playlistName: 'Test Playlist',
        songs: mockSongs
      }
    });

    // Deselect all songs
    const checkboxes = container.querySelectorAll('input[type="checkbox"]');
    for (const checkbox of checkboxes) {
      await fireEvent.click(checkbox);
    }

    const uploadButton = screen.getByText(/Upload to Spotify/);
    expect(uploadButton).toBeDisabled();
  });

  test('expands alternatives panel when song row is clicked', async () => {
    const { container } = render(CompactSongList, {
      props: {
        playlistName: 'Test Playlist',
        songs: mockSongs
      }
    });

    // Initially alternatives are hidden
    expect(screen.queryByText(/Song One Alt/)).not.toBeInTheDocument();

    // Click the first song row to expand
    const songRows = container.querySelectorAll('.song-row');
    await fireEvent.click(songRows[0]);

    // Alternatives should now be visible
    expect(screen.getByText(/Song One Alt/)).toBeInTheDocument();
  });

  test('allows selecting alternative tracks', async () => {
    const { component, container } = render(CompactSongList, {
      props: {
        playlistName: 'Test Playlist',
        songs: mockSongs
      }
    });

    const uploadSpy = vi.fn();
    component.$on('upload', uploadSpy);

    // Expand alternatives for first song
    const songRows = container.querySelectorAll('.song-row');
    await fireEvent.click(songRows[0]);

    // Select the alternative
    const radioButtons = container.querySelectorAll('input[type="radio"]');
    // Second radio should be the alternative
    await fireEvent.click(radioButtons[1]);

    // Upload
    const uploadButton = screen.getByText(/Upload to Spotify/);
    await fireEvent.click(uploadButton);

    const uploadEvent = uploadSpy.mock.calls[0][0];
    const selectedUris = uploadEvent.detail.selectedTracks;
    // Should include the alternative URI
    expect(selectedUris).toContain('spotify:track:1alt1');
  });

  test('shows music note icon for each song', () => {
    const { container } = render(CompactSongList, {
      props: {
        playlistName: 'Test Playlist',
        songs: mockSongs
      }
    });

    const musicIcons = container.querySelectorAll('.music-icon');
    expect(musicIcons.length).toBe(3);
    musicIcons.forEach(icon => {
      expect(icon.textContent).toBe('♫');
    });
  });

  test('applies correct confidence badge colors', () => {
    const { container } = render(CompactSongList, {
      props: {
        playlistName: 'Test Playlist',
        songs: mockSongs
      }
    });

    const badges = container.querySelectorAll('.confidence-badge');

    // First song (95%) should be high (green)
    expect(badges[0].classList.contains('high')).toBe(true);

    // Second song (75%) should be medium (yellow)
    expect(badges[1].classList.contains('medium')).toBe(true);

    // Third song (55%) should be low (red)
    expect(badges[2].classList.contains('low')).toBe(true);
  });

  test('select all button toggles all checkboxes', async () => {
    const { container } = render(CompactSongList, {
      props: {
        playlistName: 'Test Playlist',
        songs: mockSongs
      }
    });

    const selectAllButton = screen.getByText(/Deselect All/);

    // Click to deselect all
    await fireEvent.click(selectAllButton);
    expect(screen.getByText(/0 of 3 selected/)).toBeInTheDocument();
    expect(screen.getByText(/Select All/)).toBeInTheDocument();

    // Click again to select all
    await fireEvent.click(selectAllButton);
    expect(screen.getByText(/3 of 3 selected/)).toBeInTheDocument();
    expect(screen.getByText(/Deselect All/)).toBeInTheDocument();
  });

  test('shows create new and add to existing toggle buttons', () => {
    render(CompactSongList, {
      props: {
        playlistName: 'Test Playlist',
        songs: mockSongs,
        existingPlaylists: []
      }
    });

    expect(screen.getByText(/Create New/)).toBeInTheDocument();
    expect(screen.getByText(/Add to Existing/)).toBeInTheDocument();
  });

  test('shows playlist name input when create new is selected', () => {
    render(CompactSongList, {
      props: {
        playlistName: 'Test Playlist',
        songs: mockSongs,
        existingPlaylists: []
      }
    });

    expect(screen.getByDisplayValue('Test Playlist')).toBeInTheDocument();
  });

  test('shows playlist dropdown when add to existing is selected', async () => {
    const mockExistingPlaylists = [
      { id: 'playlist1', name: 'My Existing Playlist', tracks: { total: 10 } },
      { id: 'playlist2', name: 'Another Playlist', tracks: { total: 5 } }
    ];

    render(CompactSongList, {
      props: {
        playlistName: 'Test Playlist',
        songs: mockSongs,
        existingPlaylists: mockExistingPlaylists
      }
    });

    const addToExistingButton = screen.getByText(/Add to Existing/);
    await fireEvent.click(addToExistingButton);

    expect(screen.getByText(/My Existing Playlist/)).toBeInTheDocument();
    expect(screen.getByText(/Another Playlist/)).toBeInTheDocument();
  });

  test('button text changes based on mode', async () => {
    render(CompactSongList, {
      props: {
        playlistName: 'Test Playlist',
        songs: mockSongs,
        existingPlaylists: [{ id: 'playlist1', name: 'Existing' }]
      }
    });

    // Initially in create new mode
    expect(screen.getByText(/Upload to Spotify/)).toBeInTheDocument();

    // Switch to add to existing mode
    const addToExistingButton = screen.getByText(/Add to Existing/);
    await fireEvent.click(addToExistingButton);

    expect(screen.getByText(/Add to Playlist/)).toBeInTheDocument();
  });

  test('emits playlistId when uploading to existing playlist', async () => {
    const mockExistingPlaylists = [
      { id: 'playlist1', name: 'My Existing Playlist', tracks: { total: 10 } }
    ];

    const { component, container } = render(CompactSongList, {
      props: {
        playlistName: 'Test Playlist',
        songs: mockSongs,
        existingPlaylists: mockExistingPlaylists
      }
    });

    const uploadSpy = vi.fn();
    component.$on('upload', uploadSpy);

    // Switch to add to existing mode
    const addToExistingButton = screen.getByText(/Add to Existing/);
    await fireEvent.click(addToExistingButton);

    // Select a playlist
    const select = container.querySelector('.playlist-select');
    await fireEvent.change(select, { target: { value: 'playlist1' } });

    // Upload
    const uploadButton = screen.getByText(/Add to Playlist/);
    await fireEvent.click(uploadButton);

    expect(uploadSpy).toHaveBeenCalled();
    const uploadEvent = uploadSpy.mock.calls[0][0];
    expect(uploadEvent.detail.playlistId).toBe('playlist1');
  });
});
