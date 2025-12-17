import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import Notification from './Notification.svelte';

describe('Notification Component', () => {
  test('displays success notification', () => {
    render(Notification, {
      props: {
        message: 'Playlist created successfully!',
        type: 'success',
      },
    });

    expect(screen.getByText('Playlist created successfully!')).toBeInTheDocument();
  });

  test('displays error notification', () => {
    render(Notification, {
      props: {
        message: 'Failed to create playlist',
        type: 'error',
      },
    });

    expect(screen.getByText('Failed to create playlist')).toBeInTheDocument();
  });

  test('displays info notification', () => {
    render(Notification, {
      props: {
        message: 'Processing your request',
        type: 'info',
      },
    });

    expect(screen.getByText('Processing your request')).toBeInTheDocument();
  });

  test('applies correct CSS class for success type', () => {
    const { container } = render(Notification, {
      props: {
        message: 'Success!',
        type: 'success',
      },
    });

    const notification = container.querySelector('.notification');
    expect(notification).toHaveClass('success');
  });

  test('applies correct CSS class for error type', () => {
    const { container } = render(Notification, {
      props: {
        message: 'Error!',
        type: 'error',
      },
    });

    const notification = container.querySelector('.notification');
    expect(notification).toHaveClass('error');
  });

  test('applies correct CSS class for info type', () => {
    const { container } = render(Notification, {
      props: {
        message: 'Info!',
        type: 'info',
      },
    });

    const notification = container.querySelector('.notification');
    expect(notification).toHaveClass('info');
  });

  test('displays checkmark icon for success', () => {
    render(Notification, {
      props: {
        message: 'Success!',
        type: 'success',
      },
    });

    const notification = screen.getByText(/success!/i).closest('.notification');
    expect(notification.textContent).toContain('✅');
  });

  test('displays X icon for error', () => {
    render(Notification, {
      props: {
        message: 'Error!',
        type: 'error',
      },
    });

    const notification = screen.getByText(/error!/i).closest('.notification');
    expect(notification.textContent).toContain('❌');
  });

  test('displays info icon for info', () => {
    render(Notification, {
      props: {
        message: 'Information',
        type: 'info',
      },
    });

    const notification = screen.getByText(/information/i).closest('.notification');
    expect(notification.textContent).toContain('ℹ️');
  });

  test('renders with default type if not specified', () => {
    render(Notification, {
      props: {
        message: 'Default notification',
      },
    });

    const notification = screen.getByText('Default notification').closest('.notification');
    expect(notification).toHaveClass('info');
  });
});
