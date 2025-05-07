import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
    palette: {
        mode: 'light',
        primary: {
            main: '#1890ff',
            light: '#bae7ff',
            dark: '#0050b3',
            contrastText: '#ffffff',
        },
        secondary: {
            main: '#6b7280',
            light: '#9ca3af',
            dark: '#374151',
            contrastText: '#ffffff',
        },
        error: {
            main: '#ef4444',
            light: '#fef2f2',
            dark: '#dc2626',
        },
        warning: {
            main: '#f59e0b',
            light: '#fffbeb',
            dark: '#d97706',
        },
        success: {
            main: '#10b981',
            light: '#ecfdf5',
            dark: '#059669',
        },
        background: {
            default: '#f3f4f6',
            paper: '#ffffff',
        },
        text: {
            primary: '#111827',
            secondary: '#6b7280',
        },
    },
    shape: {
        borderRadius: 8,
    },
    typography: {
        fontFamily: '"Inter", "Helvetica", "Arial", sans-serif',
        h1: {
            fontWeight: 800,
        },
        h2: {
            fontWeight: 700,
        },
        h3: {
            fontWeight: 600,
        },
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    textTransform: 'none',
                },
            },
        },
    },
});

// Create a dark theme
export const darkTheme = createTheme({
    ...theme,
    palette: {
        ...theme.palette,
        mode: 'dark',
        primary: {
            main: '#1890ff',
            light: '#bae7ff',
            dark: '#0050b3',
            contrastText: '#ffffff',
        },
        background: {
            default: '#111827',
            paper: '#1f2937',
        },
        text: {
            primary: '#f9fafb',
            secondary: '#d1d5db',
        },
    },
});