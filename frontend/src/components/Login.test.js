import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import Login from './Login.svelte';
import * as api from '../lib/api.js';

describe('Login Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  test('renders login button', () => {
    render(Login);
    const button = screen.getByRole('button', { name: /login with spotify/i });
    expect(button).toBeInTheDocument();
  });

  test('displays Christmas greeting', () => {
    render(Login);
    expect(screen.getByText(/listify your vibe/i)).toBeInTheDocument();
  });

  test('shows feature list', () => {
    render(Login);

    // Check for key features
    expect(screen.getByText(/smart song matching/i)).toBeInTheDocument();
    expect(screen.getByText(/paste your playlist/i)).toBeInTheDocument();
    expect(screen.getByText(/instant upload/i)).toBeInTheDocument();
  });

  test('initiates login when button is clicked', async () => {
    // Mock window.location
    delete window.location;
    window.location = { href: '' };

    const mockAuthLogin = vi.spyOn(api.auth, 'login').mockResolvedValue({
      authUrl: 'https://accounts.spotify.com/authorize?test',
    });

    render(Login);

    const button = screen.getByRole('button', { name: /login with spotify/i });
    await fireEvent.click(button);

    // Wait for async operation
    await vi.waitFor(() => {
      expect(mockAuthLogin).toHaveBeenCalled();
    });
  });

  test('applies correct CSS class to login button', () => {
    render(Login);
    const button = screen.getByRole('button', { name: /login with spotify/i });
    expect(button).toHaveClass('login-button');
  });

  test('has accessible button with Christmas tree icon', () => {
    render(Login);
    const button = screen.getByRole('button', { name: /login with spotify/i });
    expect(button.textContent).toContain('🎄');
  });

  test('shows loading state when login is in progress', async () => {
    const mockAuthLogin = vi.spyOn(api.auth, 'login').mockImplementation(
      () => new Promise(() => {}) // Never resolves to keep loading state
    );

    render(Login);

    const button = screen.getByRole('button', { name: /login with spotify/i });
    await fireEvent.click(button);

    expect(screen.getByText(/connecting to spotify/i)).toBeInTheDocument();
    expect(button).toBeDisabled();
  });

  test('dispatches notification event on login error', async () => {
    const mockAuthLogin = vi.spyOn(api.auth, 'login').mockRejectedValue(
      new Error('Login failed')
    );

    const { component } = render(Login);

    const notificationSpy = vi.fn();
    component.$on('notification', notificationSpy);

    const button = screen.getByRole('button', { name: /login with spotify/i });
    await fireEvent.click(button);

    // Wait for error handling
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(notificationSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: {
          message: 'Failed to initiate login',
          type: 'error',
        },
      })
    );
  });
});
