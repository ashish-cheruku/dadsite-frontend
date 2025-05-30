import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeProvider, useTheme } from '../contexts/ThemeContext'; // Import full context for provider
import ThemeToggleButton from './ThemeToggleButton';

// Mock localStorage for ThemeProvider
let mockLocalStorage;

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
  // Default matchMedia mock
  window.matchMedia = jest.fn().mockReturnValue({ matches: false, addListener: jest.fn(), removeListener: jest.fn() });
});

afterEach(() => {
  localStorage.clear();
  document.documentElement.classList.remove('dark');
});

// Helper to render components within ThemeProvider
const renderWithThemeProvider = (ui, providerProps) => {
  return render(
    <ThemeProvider {...providerProps}>
      {ui}
    </ThemeProvider>
  );
};


describe('ThemeToggleButton', () => {
  test('renders correctly and displays moon icon for light theme', () => {
    // Set initial theme to light via localStorage for ThemeProvider
    localStorage.setItem('theme', 'light');
    renderWithThemeProvider(<ThemeToggleButton />);
    
    const button = screen.getByRole('button', { name: /toggle theme/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('🌙'); // Moon icon for light theme
  });

  test('renders correctly and displays sun icon for dark theme', () => {
    // Set initial theme to dark via localStorage for ThemeProvider
    localStorage.setItem('theme', 'dark');
    renderWithThemeProvider(<ThemeToggleButton />);
    
    const button = screen.getByRole('button', { name: /toggle theme/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('☀️'); // Sun icon for dark theme
  });

  test('clicking the button calls toggleTheme and changes the icon', () => {
    // Start with light theme
    localStorage.setItem('theme', 'light');
    renderWithThemeProvider(<ThemeToggleButton />);

    const button = screen.getByRole('button', { name: /toggle theme/i });
    expect(button).toHaveTextContent('🌙'); // Initially moon

    // Spy on toggleTheme (though ThemeProvider handles the actual logic, we check the effect)
    // We can also check if the theme value changes in a consumer if needed,
    // but for this component, checking icon change is sufficient to infer toggleTheme was called.

    act(() => {
      fireEvent.click(button);
    });

    // After click, theme should be dark, icon should be sun
    expect(button).toHaveTextContent('☀️');
    expect(localStorage.getItem('theme')).toBe('dark'); // Check if ThemeProvider updated localStorage

    act(() => {
      fireEvent.click(button);
    });

    // After another click, theme should be light, icon should be moon
    expect(button).toHaveTextContent('🌙');
    expect(localStorage.getItem('theme')).toBe('light');
  });

  test('button has basic accessibility attributes', () => {
    localStorage.setItem('theme', 'light');
    renderWithThemeProvider(<ThemeToggleButton />);
    const button = screen.getByRole('button', { name: /toggle theme/i });
    expect(button).toHaveAttribute('aria-label', 'Toggle theme');
  });
});
