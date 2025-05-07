"use client"
import IconButton from '@mui/material/IconButton';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { useThemeToggle } from './theme-provider';

export function ThemeToggle() {
    const { isDarkMode, toggleTheme } = useThemeToggle();

    return (
        <IconButton
            onClick={toggleTheme}
            color="inherit"
            aria-label="Toggle theme"
        >
            {isDarkMode ? <Brightness7Icon /> : <Brightness4Icon />}
        </IconButton>
    );
}