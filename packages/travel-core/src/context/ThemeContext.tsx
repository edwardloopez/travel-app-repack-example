import React, { createContext, ReactNode, useContext } from 'react';

interface Theme {
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    error: string;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
}

const lightTheme: Theme = {
  colors: {
    primary: '#2196F3',
    secondary: '#03DAC6',
    background: '#FFFFFF',
    surface: '#F5F5F5',
    text: '#000000',
    error: '#B00020',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
};

const ThemeContext = createContext<Theme>(lightTheme);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  return (
    <ThemeContext.Provider value={lightTheme}>{children}</ThemeContext.Provider>
  );
};

export const useTheme = () => {
  return useContext(ThemeContext);
};
