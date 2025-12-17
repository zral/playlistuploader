import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import Header from './Header.svelte';

describe('Header Component', () => {
  const mockUser = {
    user: {
      id: 'user123',
      display_name: 'Test User',
      email: 'test@example.com',
      images: [{ url: 'https://example.com/avatar.jpg' }],
    }
  };

  test('renders app title', () => {
    render(Header);
    expect(screen.getByText(/spotify playlist uploader/i)).toBeInTheDocument();
  });

  test('displays Christmas tree emoji', () => {
    const { container } = render(Header);
    const header = container.querySelector('header');
    expect(header.textContent).toContain('🎄');
  });

  test('shows subtitle', () => {
    render(Header);
    expect(screen.getByText(/upload your text playlists to spotify with festive cheer/i)).toBeInTheDocument();
  });

  test('shows user info when user is provided', () => {
    render(Header, { props: { user: mockUser } });

    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });

  test('does not show user info when user is null', () => {
    render(Header, { props: { user: null } });

    expect(screen.queryByText('Test User')).not.toBeInTheDocument();
  });

  test('displays logout button when user is logged in', () => {
    render(Header, { props: { user: mockUser } });

    const logoutButton = screen.getByRole('button', { name: /logout/i });
    expect(logoutButton).toBeInTheDocument();
  });

  test('emits logout event when logout button is clicked', async () => {
    const { component } = render(Header, { props: { user: mockUser } });

    const logoutSpy = vi.fn();
    component.$on('logout', logoutSpy);

    const logoutButton = screen.getByRole('button', { name: /logout/i });
    await fireEvent.click(logoutButton);

    expect(logoutSpy).toHaveBeenCalled();
  });

  test('does not show logout button when user is not logged in', () => {
    render(Header, { props: { user: null } });

    expect(screen.queryByRole('button', { name: /logout/i })).not.toBeInTheDocument();
  });

  test('displays user avatar when user has images', () => {
    const { container } = render(Header, { props: { user: mockUser } });

    const avatar = container.querySelector('.user-avatar');
    expect(avatar).toBeInTheDocument();
    expect(avatar.src).toContain('example.com/avatar.jpg');
    expect(avatar.alt).toBe('Test User');
  });

  test('handles user without avatar gracefully', () => {
    const userWithoutAvatar = {
      ...mockUser,
      images: [],
    };

    const { container } = render(Header, { props: { user: userWithoutAvatar } });

    // Should not display avatar image
    const avatar = container.querySelector('.user-avatar');
    expect(avatar).not.toBeInTheDocument();

    // Should still display user name
    expect(screen.getByText('Test User')).toBeInTheDocument();
  });

  test('displays Christmas lights decoration', () => {
    const { container } = render(Header);

    const lights = container.querySelectorAll('.light');
    expect(lights.length).toBe(5);
  });

  test('displays user email', () => {
    render(Header, { props: { user: mockUser } });

    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });

  test('has correct structure with header-content', () => {
    const { container } = render(Header);

    const headerContent = container.querySelector('.header-content');
    expect(headerContent).toBeInTheDocument();
  });
});
