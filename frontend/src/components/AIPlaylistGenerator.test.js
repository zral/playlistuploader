import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import AIPlaylistGenerator from './AIPlaylistGenerator.svelte';
import * as api from '../lib/api';

// Mock the api module
vi.mock('../lib/api', () => ({
  ai: {
    generatePlaylist: vi.fn()
  }
}));

describe('AIPlaylistGenerator Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('renders with correct title and subtitle', () => {
    render(AIPlaylistGenerator, {
      props: {
        onGenerate: vi.fn()
      }
    });

    expect(screen.getByText(/Create Your Perfect Playlist/)).toBeInTheDocument();
    expect(screen.getByText(/Describe your vibe, we'll find the tracks/)).toBeInTheDocument();
  });

  test('is always visible without toggle button', () => {
    const { container } = render(AIPlaylistGenerator, {
      props: {
        onGenerate: vi.fn()
      }
    });

    // Should not have a toggle button
    expect(container.querySelector('.toggle-button')).not.toBeInTheDocument();

    // Form should be visible
    expect(screen.getByLabelText(/What's the vibe\?/)).toBeInTheDocument();
  });

  test('has textarea for playlist description', () => {
    render(AIPlaylistGenerator, {
      props: {
        onGenerate: vi.fn()
      }
    });

    const textarea = screen.getByPlaceholderText(/Upbeat Nordic pop for a road trip/);
    expect(textarea).toBeInTheDocument();
    expect(textarea.rows).toBe(4);
  });

  test('has radio buttons for playlist length type', () => {
    const { container } = render(AIPlaylistGenerator, {
      props: {
        onGenerate: vi.fn()
      }
    });

    const radioLabels = container.querySelectorAll('.radio-label');
    expect(radioLabels.length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText(/Number of Songs/).length).toBeGreaterThan(0);
    expect(screen.getByText(/Duration \(minutes\)/)).toBeInTheDocument();
  });

  test('defaults to 25 songs', () => {
    const { container } = render(AIPlaylistGenerator, {
      props: {
        onGenerate: vi.fn()
      }
    });

    const songCountInput = container.querySelector('#song-count');
    expect(songCountInput.value).toBe('25');
  });

  test('defaults to 90 minutes for duration', async () => {
    const { container } = render(AIPlaylistGenerator, {
      props: {
        onGenerate: vi.fn()
      }
    });

    // Switch to duration mode - click the radio button with value="duration"
    const durationRadio = container.querySelector('input[type="radio"][value="duration"]');
    await fireEvent.click(durationRadio);

    const durationInput = container.querySelector('#duration');
    expect(durationInput.value).toBe('90');
  });

  test('has Generate Playlist button', () => {
    render(AIPlaylistGenerator, {
      props: {
        onGenerate: vi.fn()
      }
    });

    expect(screen.getByText(/Generate Playlist/)).toBeInTheDocument();
  });

  test('shows character count', () => {
    render(AIPlaylistGenerator, {
      props: {
        onGenerate: vi.fn()
      }
    });

    expect(screen.getByText(/0\/500/)).toBeInTheDocument();
  });

  test('updates character count as user types', async () => {
    render(AIPlaylistGenerator, {
      props: {
        onGenerate: vi.fn()
      }
    });

    const textarea = screen.getByPlaceholderText(/Upbeat Nordic pop for a road trip/);
    await fireEvent.input(textarea, { target: { value: 'Test description' } });

    expect(screen.getByText(/16\/500/)).toBeInTheDocument();
  });

  test('disables generate button when description is empty', () => {
    render(AIPlaylistGenerator, {
      props: {
        onGenerate: vi.fn()
      }
    });

    const button = screen.getByRole('button', { name: /Generate Playlist/ });
    expect(button).toBeDisabled();
  });

  test('enables generate button when description is provided', async () => {
    render(AIPlaylistGenerator, {
      props: {
        onGenerate: vi.fn()
      }
    });

    const textarea = screen.getByPlaceholderText(/Upbeat Nordic pop for a road trip/);
    await fireEvent.input(textarea, { target: { value: 'Chill vibes' } });

    const button = screen.getByText(/Generate Playlist/);
    expect(button).not.toBeDisabled();
  });

  test('shows error notification for short description', async () => {
    const { component } = render(AIPlaylistGenerator, {
      props: {
        onGenerate: vi.fn()
      }
    });

    const notificationSpy = vi.fn();
    component.$on('notification', notificationSpy);

    const textarea = screen.getByPlaceholderText(/Upbeat Nordic pop for a road trip/);
    await fireEvent.input(textarea, { target: { value: 'Test' } });

    const button = screen.getByText(/Generate Playlist/);
    await fireEvent.click(button);

    expect(notificationSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: expect.objectContaining({
          type: 'error',
          message: expect.stringContaining('too short')
        })
      })
    );
  });

  test('calls onGenerate callback when generation succeeds', async () => {
    const mockGenerateResponse = {
      playlist: 'Artist 1 - Song 1\nArtist 2 - Song 2',
      metadata: {
        songCount: 2,
        generationTime: 1500
      }
    };

    api.ai.generatePlaylist.mockResolvedValue(mockGenerateResponse);

    const onGenerateMock = vi.fn();
    const { component } = render(AIPlaylistGenerator, {
      props: {
        onGenerate: onGenerateMock
      }
    });

    const notificationSpy = vi.fn();
    component.$on('notification', notificationSpy);

    const textarea = screen.getByPlaceholderText(/Upbeat Nordic pop for a road trip/);
    await fireEvent.input(textarea, { target: { value: 'Chill electronic music' } });

    const button = screen.getByText(/Generate Playlist/);
    await fireEvent.click(button);

    await waitFor(() => {
      expect(onGenerateMock).toHaveBeenCalledWith(mockGenerateResponse.playlist);
    });

    expect(notificationSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: expect.objectContaining({
          type: 'success',
          message: expect.stringContaining('Generated 2 songs')
        })
      })
    );
  });

  test('shows loading state during generation', async () => {
    api.ai.generatePlaylist.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    render(AIPlaylistGenerator, {
      props: {
        onGenerate: vi.fn()
      }
    });

    const textarea = screen.getByPlaceholderText(/Upbeat Nordic pop for a road trip/);
    await fireEvent.input(textarea, { target: { value: 'Chill electronic music' } });

    const button = screen.getByRole('button', { name: /Generate Playlist/ });
    await fireEvent.click(button);

    expect(screen.getByText(/Generating.../)).toBeInTheDocument();
    expect(button).toBeDisabled();
  });

  test('handles API errors gracefully', async () => {
    api.ai.generatePlaylist.mockRejectedValue(new Error('API Error'));

    const { component } = render(AIPlaylistGenerator, {
      props: {
        onGenerate: vi.fn()
      }
    });

    const notificationSpy = vi.fn();
    component.$on('notification', notificationSpy);

    const textarea = screen.getByPlaceholderText(/Upbeat Nordic pop for a road trip/);
    await fireEvent.input(textarea, { target: { value: 'Chill electronic music' } });

    const button = screen.getByText(/Generate Playlist/);
    await fireEvent.click(button);

    await waitFor(() => {
      expect(notificationSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: expect.objectContaining({
            type: 'error'
          })
        })
      );
    });
  });

  test('switches between song count and duration modes', async () => {
    const { container } = render(AIPlaylistGenerator, {
      props: {
        onGenerate: vi.fn()
      }
    });

    // Initially shows song count input
    expect(container.querySelector('#song-count')).toBeInTheDocument();

    // Switch to duration mode
    const durationRadio = container.querySelector('input[type="radio"][value="duration"]');
    await fireEvent.click(durationRadio);

    // Should now show duration input instead of song count
    expect(container.querySelector('#song-count')).not.toBeInTheDocument();
    expect(container.querySelector('#duration')).toBeInTheDocument();
  });

  test('sends correct parameters for song count mode', async () => {
    const mockGenerateResponse = {
      playlist: 'Artist 1 - Song 1',
      metadata: { songCount: 1, generationTime: 1000 }
    };

    api.ai.generatePlaylist.mockResolvedValue(mockGenerateResponse);

    render(AIPlaylistGenerator, {
      props: {
        onGenerate: vi.fn()
      }
    });

    const textarea = screen.getByPlaceholderText(/Upbeat Nordic pop for a road trip/);
    await fireEvent.input(textarea, { target: { value: 'Chill electronic music' } });

    const button = screen.getByText(/Generate Playlist/);
    await fireEvent.click(button);

    await waitFor(() => {
      expect(api.ai.generatePlaylist).toHaveBeenCalledWith({
        description: 'Chill electronic music',
        songCount: 25,
        durationMinutes: undefined
      });
    });
  });

  test('sends correct parameters for duration mode', async () => {
    const mockGenerateResponse = {
      playlist: 'Artist 1 - Song 1',
      metadata: { songCount: 1, generationTime: 1000 }
    };

    api.ai.generatePlaylist.mockResolvedValue(mockGenerateResponse);

    const { container } = render(AIPlaylistGenerator, {
      props: {
        onGenerate: vi.fn()
      }
    });

    // Switch to duration mode
    const durationRadio = container.querySelector('input[type="radio"][value="duration"]');
    await fireEvent.click(durationRadio);

    const textarea = screen.getByPlaceholderText(/Upbeat Nordic pop for a road trip/);
    await fireEvent.input(textarea, { target: { value: 'Chill electronic music' } });

    const button = screen.getByText(/Generate Playlist/);
    await fireEvent.click(button);

    await waitFor(() => {
      expect(api.ai.generatePlaylist).toHaveBeenCalledWith({
        description: 'Chill electronic music',
        songCount: undefined,
        durationMinutes: 90
      });
    });
  });
});
