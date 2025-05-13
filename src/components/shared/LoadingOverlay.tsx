import React from 'react';
import { Box, CircularProgress, Typography, useTheme } from '@mui/material';

interface LoadingOverlayProps {
    message?: string;
}

const LoadingOverlay = ({ message = 'Loading...' }: LoadingOverlayProps) => {
    const theme = useTheme();

    return (
        <Box
            sx={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: `rgba(${theme.palette.mode === 'dark' ? '0, 0, 0, 0.7' : '255, 255, 255, 0.7'})`,
                zIndex: theme.zIndex.modal + 1,
                backdropFilter: 'blur(5px)',
            }}
        >
            <CircularProgress size={60} />
            <Typography variant="h6" sx={{ mt: 2 }}>
                {message}
            </Typography>
        </Box>
    );
};

export default LoadingOverlay;