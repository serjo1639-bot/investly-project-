import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightColors, darkColors, SHADOWS_LIGHT, SHADOWS_DARK } from '../constants/theme';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('investly_theme');
        if (savedTheme === 'dark') {
          setIsDarkMode(true);
        }
      } catch (e) {
        // Ignore error
      } finally {
        setIsLoaded(true);
      }
    };
    loadTheme();
  }, []);

  const toggleTheme = async () => {
    try {
      const newMode = !isDarkMode;
      setIsDarkMode(newMode);
      await AsyncStorage.setItem('investly_theme', newMode ? 'dark' : 'light');
    } catch (e) {
      // Ignore error
    }
  };

  const themeData = useMemo(() => {
    const colors = isDarkMode ? darkColors : lightColors;
    const shadows = isDarkMode ? SHADOWS_DARK : SHADOWS_LIGHT;
    return {
      isDarkMode,
      toggleTheme,
      colors,
      shadows,
    };
  }, [isDarkMode]);

  if (!isLoaded) return null; // Avoid flicker

  return (
    <ThemeContext.Provider value={themeData}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
