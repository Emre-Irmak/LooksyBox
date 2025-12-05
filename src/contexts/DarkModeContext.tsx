import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

type ThemeMode = 'light' | 'dark' | 'pink';

interface DarkModeContextType {
  isDarkMode: boolean;
  themeMode: ThemeMode;
  toggleDarkMode: () => void;
  setThemeMode: (mode: ThemeMode) => void;
  refreshPage: () => void;
}

const DarkModeContext = createContext<DarkModeContextType | undefined>(undefined);

interface DarkModeProviderProps {
  children: ReactNode;
}

export const DarkModeProvider = ({ children }: DarkModeProviderProps) => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    // localStorage'dan theme tercihini yükle
    const saved = localStorage.getItem('themeMode');
    return (saved as ThemeMode) || 'light';
  });

  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  // Theme değiştiğinde localStorage'a kaydet ve body class'larını güncelle
  useEffect(() => {
    localStorage.setItem('themeMode', themeMode);
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
    
    // Body class'larını güncelle
    document.body.classList.remove('dark', 'pink');
    if (themeMode === 'dark') {
      document.body.classList.add('dark');
    } else if (themeMode === 'pink') {
      document.body.classList.add('pink');
    }
  }, [themeMode, isDarkMode]);

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    setIsDarkMode(mode === 'dark');
    // Tema değişikliğinde sayfa yenileme kaldırıldı - session korunur
  };

  const refreshPage = () => {
    window.location.reload();
  };

  const toggleDarkMode = () => {
    if (themeMode === 'light') {
      setThemeMode('dark');
    } else if (themeMode === 'dark') {
      setThemeMode('pink');
    } else {
      setThemeMode('light');
    }
  };

  return (
    <DarkModeContext.Provider value={{ isDarkMode, themeMode, toggleDarkMode, setThemeMode, refreshPage }}>
      {children}
    </DarkModeContext.Provider>
  );
};

export const useDarkMode = () => {
  const context = useContext(DarkModeContext);
  if (context === undefined) {
    throw new Error('useDarkMode must be used within a DarkModeProvider');
  }
  return context;
};
