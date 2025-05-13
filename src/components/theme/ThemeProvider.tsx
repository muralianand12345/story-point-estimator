"use client";

import React, { createContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { ThemeProvider as MUIThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
    mode: ThemeMode;
    setMode: (mode: ThemeMode) => void;
}

export const ThemeContext = createContext<ThemeContextType>({
    mode: 'system',
    setMode: () => { },
});

interface ThemeProviderProps {
    children: ReactNode;
}

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
    const [mode, setMode] = useState<ThemeMode>('system');
    const [effectiveMode, setEffectiveMode] = useState<'light' | 'dark'>('light');

    useEffect(() => {
        // Load theme preference from localStorage
        const savedMode = localStorage.getItem('themeMode') as ThemeMode;
        if (savedMode) {
            setMode(savedMode);
        }
    }, []);

    useEffect(() => {
        // Save theme preference to localStorage
        if (mode !== 'system') {
            localStorage.setItem('themeMode', mode);
            setEffectiveMode(mode);
        } else {
            localStorage.removeItem('themeMode');
            // Check system preference
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            setEffectiveMode(prefersDark ? 'dark' : 'light');

            // Listen for system theme changes
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            const handleChange = (e: MediaQueryListEvent) => {
                setEffectiveMode(e.matches ? 'dark' : 'light');
            };

            mediaQuery.addEventListener('change', handleChange);
            return () => mediaQuery.removeEventListener('change', handleChange);
        }
    }, [mode]);

    const theme = useMemo(
        () =>
            createTheme({
                palette: {
                    mode: effectiveMode,
                    primary: {
                        main: '#3f51b5',
                    },
                    secondary: {
                        main: '#f50057',
                    },
                    background: {
                        default: effectiveMode === 'light' ? '#f5f5f5' : '#121212',
                        paper: effectiveMode === 'light' ? '#ffffff' : '#1e1e1e',
                    },
                },
                typography: {
                    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
                    h1: {
                        fontSize: '2.5rem',
                        fontWeight: 500,
                    },
                    h2: {
                        fontSize: '2rem',
                        fontWeight: 500,
                    },
                },
                components: {
                    MuiButton: {
                        styleOverrides: {
                            root: {
                                borderRadius: 8,
                                textTransform: 'none',
                            },
                        },
                    },
                    MuiCard: {
                        styleOverrides: {
                            root: {
                                borderRadius: 12,
                                boxShadow: effectiveMode === 'light'
                                    ? '0px 4px 12px rgba(0, 0, 0, 0.05)'
                                    : '0px 4px 12px rgba(0, 0, 0, 0.2)',
                            },
                        },
                    },
                },
            }),
        [effectiveMode],
    );

    const contextValue = useMemo(() => ({ mode, setMode }), [mode]);

    return (
        <ThemeContext.Provider value={contextValue}>
            <MUIThemeProvider theme={theme}>
                <CssBaseline />
                {children}
            </MUIThemeProvider>
        </ThemeContext.Provider>
    );
};