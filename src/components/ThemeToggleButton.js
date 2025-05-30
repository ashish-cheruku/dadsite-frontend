import React from 'react';
import { useTheme } from '../contexts/ThemeContext.js';

const ThemeToggleButton = () => {
  const { theme, toggleTheme } = useTheme();

  const buttonStyle = {
    padding: '10px 15px',
    fontSize: '1.5rem', // Made icons a bit larger
    cursor: 'pointer',
    border: '1px solid #ccc',
    borderRadius: '5px',
    background: 'none', // Transparent background
  };

  return (
    <button onClick={toggleTheme} style={buttonStyle} aria-label="Toggle theme">
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  );
};

export default ThemeToggleButton;
