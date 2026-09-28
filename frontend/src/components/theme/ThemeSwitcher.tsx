import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import type { Theme } from '../../context/ThemeContext';

export const ThemeSwitcher: React.FC = () => {
  const { theme, setTheme } = useTheme();

  const options: { mode: Theme; label: string; icon: React.ReactNode }[] = [
    { mode: 'light', label: 'Light Mode', icon: <Sun size={15} /> },
    { mode: 'dark', label: 'Dark Mode', icon: <Moon size={15} /> },
    { mode: 'system', label: 'System Theme', icon: <Monitor size={15} /> },
  ];

  return (
    <div className="theme-switcher-container" role="radiogroup" aria-label="Theme Switcher">
      {options.map((opt) => {
        const isActive = theme === opt.mode;
        return (
          <button
            key={opt.mode}
            type="button"
            className={`theme-switcher-btn ${isActive ? 'active' : ''}`}
            onClick={() => setTheme(opt.mode)}
            title={opt.label}
            aria-label={opt.label}
            aria-checked={isActive}
            role="radio"
          >
            <span className="theme-switcher-icon">{opt.icon}</span>
            <span className="theme-switcher-label">{opt.mode.charAt(0).toUpperCase() + opt.mode.slice(1)}</span>
          </button>
        );
      })}
    </div>
  );
};

export default ThemeSwitcher;
