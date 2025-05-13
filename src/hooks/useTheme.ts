import { useContext } from 'react';
import { ThemeContext } from '../components/theme/ThemeProvider';

export const useTheme = () => {
    return useContext(ThemeContext);
};