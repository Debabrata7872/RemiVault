import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';

export type Theme = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  userPreference: Theme;
  setTheme: (theme: Theme) => void;
}

const THEME_STORAGE_KEY = 'remivault_theme_mode';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  // Read user's saved preference from localStorage
  const [userPreference, setUserPreference] = useState<Theme>(() => {
    const saved = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
    return saved === 'light' || saved === 'dark' || saved === 'system' ? saved : 'system';
  });

  // Rule: Before login (user === null), screen MUST adapt system colour theme ('system')
  // After login, screen uses the user's saved preference
  const effectiveTheme: Theme = user ? userPreference : 'system';

  // Calculate resolved theme (light or dark)
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => {
    if (effectiveTheme === 'system') {
      return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
    }
    return effectiveTheme;
  });

  // Handle system preference changes & theme synchronization
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const updateResolvedTheme = () => {
      const activeResolved: ResolvedTheme = effectiveTheme === 'system'
        ? (mediaQuery.matches ? 'dark' : 'light')
        : effectiveTheme;

      setResolvedTheme(activeResolved);

      // Apply data-theme and classes to html document root
      document.documentElement.setAttribute('data-theme', activeResolved);
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(activeResolved);
      
      // Update browser color-scheme
      document.documentElement.style.colorScheme = activeResolved;
    };

    updateResolvedTheme();

    const handleSystemChange = () => {
      if (effectiveTheme === 'system') {
        updateResolvedTheme();
      }
    };

    mediaQuery.addEventListener('change', handleSystemChange);
    return () => mediaQuery.removeEventListener('change', handleSystemChange);
  }, [effectiveTheme]);

  const setTheme = (newTheme: Theme) => {
    setUserPreference(newTheme);
    localStorage.setItem(THEME_STORAGE_KEY, newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme: effectiveTheme, resolvedTheme, userPreference, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
