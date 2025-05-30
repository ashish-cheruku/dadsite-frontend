import React from 'react';
import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeProvider, useTheme } from './ThemeContext';

// Helper component to consume the context and display values
const TestConsumer = () => {
  const { theme, toggleTheme } = useTheme();
  return (
    <div>
      <span data-testid="theme-value">{theme}</span>
      <button onClick={toggleTheme} data-testid="toggle-button">
        Toggle
      </button>
    </div>
  );
};

// Helper to render the provider with the consumer
const renderWithProvider = (ui) => {
  return render(
    <ThemeProvider>
      {ui}
    </ThemeProvider>
  );
};

describe('ThemeContext', () => {
  // Mock localStorage
  let mockLocalStorage;
  let originalMatchMedia;

  beforeEach(() => {
    mockLocalStorage = {};
    global.localStorage = {
      getItem: (key) => mockLocalStorage[key] || null,
      setItem: (key, value) => {
        mockLocalStorage[key] = value.toString();
      },
      removeItem: (key) => {
        delete mockLocalStorage[key];
      },
      clear: () => {
        mockLocalStorage = {};
      },
    };

    // Mock window.matchMedia
    originalMatchMedia = window.matchMedia;
    window.matchMedia = jest.fn();
  });

  afterEach(() => {
    // Clean up mocks
    localStorage.clear();
    document.documentElement.classList.remove('dark'); // Reset class
    window.matchMedia = originalMatchMedia; // Restore original matchMedia
  });

  test('initializes with "light" theme by default if no localStorage or system preference', () => {
    window.matchMedia.mockReturnValue({ matches: false, addListener: jest.fn(), removeListener: jest.fn() });
    renderWithProvider(<TestConsumer />);
    expect(screen.getByTestId('theme-value')).toHaveTextContent('light');
    expect(document.documentElement).not.toHaveClass('dark');
  });

  test('initializes with theme from localStorage if available', () => {
    localStorage.setItem('theme', 'dark');
    window.matchMedia.mockReturnValue({ matches: false, addListener: jest.fn(), removeListener: jest.fn() });
    renderWithProvider(<TestConsumer />);
    expect(screen.getByTestId('theme-value')).toHaveTextContent('dark');
    expect(document.documentElement).toHaveClass('dark');
  });

  test('initializes with system preference "dark" if localStorage is not set and prefers-color-scheme is dark', () => {
    window.matchMedia.mockReturnValue({ matches: true, addListener: jest.fn(), removeListener: jest.fn() });
    renderWithProvider(<TestConsumer />);
    expect(screen.getByTestId('theme-value')).toHaveTextContent('dark');
    expect(document.documentElement).toHaveClass('dark');
  });

  test('initializes with "light" if localStorage is not set and prefers-color-scheme is light', () => {
    window.matchMedia.mockReturnValue({ matches: false, addListener: jest.fn(), removeListener: jest.fn() });
    renderWithProvider(<TestConsumer />);
    expect(screen.getByTestId('theme-value')).toHaveTextContent('light');
    expect(document.documentElement).not.toHaveClass('dark');
  });

  test('toggleTheme switches theme from light to dark and updates localStorage and html class', () => {
    window.matchMedia.mockReturnValue({ matches: false, addListener: jest.fn(), removeListener: jest.fn() }); // Default to light
    renderWithProvider(<TestConsumer />);
    
    expect(screen.getByTestId('theme-value')).toHaveTextContent('light');
    expect(document.documentElement).not.toHaveClass('dark');
    expect(localStorage.getItem('theme')).toBe('light'); // Initial state set by provider

    act(() => {
      screen.getByTestId('toggle-button').click();
    });

    expect(screen.getByTestId('theme-value')).toHaveTextContent('dark');
    expect(localStorage.getItem('theme')).toBe('dark');
    expect(document.documentElement).toHaveClass('dark');
  });

  test('toggleTheme switches theme from dark to light and updates localStorage and html class', () => {
    localStorage.setItem('theme', 'dark'); // Start with dark theme
    window.matchMedia.mockReturnValue({ matches: true, addListener: jest.fn(), removeListener: jest.fn() });
    renderWithProvider(<TestConsumer />);

    expect(screen.getByTestId('theme-value')).toHaveTextContent('dark');
    expect(document.documentElement).toHaveClass('dark');
    expect(localStorage.getItem('theme')).toBe('dark');

    act(() => {
      screen.getByTestId('toggle-button').click();
    });

    expect(screen.getByTestId('theme-value')).toHaveTextContent('light');
    expect(localStorage.getItem('theme')).toBe('light');
    expect(document.documentElement).not.toHaveClass('dark');
  });

  test('theme is applied to html element correctly on initial load (dark)', () => {
    localStorage.setItem('theme', 'dark');
    window.matchMedia.mockReturnValue({ matches: false, addListener: jest.fn(), removeListener: jest.fn() });
    renderWithProvider(<TestConsumer />);
    expect(document.documentElement).toHaveClass('dark');
  });

  test('theme is applied to html element correctly on initial load (light)', () => {
    localStorage.setItem('theme', 'light');
    window.matchMedia.mockReturnValue({ matches: false, addListener: jest.fn(), removeListener: jest.fn() });
    renderWithProvider(<TestConsumer />);
    expect(document.documentElement).not.toHaveClass('dark');
  });
});
