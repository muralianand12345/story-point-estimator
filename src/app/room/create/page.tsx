'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Container,
    Box,
    Typography,
    TextField,
    Button,
    Paper,
    CircularProgress,
    Alert,
    useTheme
} from '@mui/material';
import ThemeToggle from '@/components/ui/ThemeToggle';

const CreateRoomPage: React.FC = () => {
    const [roomName, setRoomName] = useState<string>('');
    const [hostName, setHostName] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const router = useRouter();
    const theme = useTheme();

    const handleCreateRoom = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const response = await fetch('/api/room', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ roomName, hostName }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to create room');
            }

            const data = await response.json();

            // Store user data in localStorage
            localStorage.setItem('userId', data.userId);
            localStorage.setItem('userName', data.userName);

            // Redirect to room page
            router.push(`/room/${data.roomId}`);
        } catch (error) {
            console.error('Error creating room:', error);
            setError(error instanceof Error ? error.message : 'Failed to create room');
            setIsLoading(false);
        }
    };

    return (
        <Container
            maxWidth="sm"
            sx={{
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                backgroundColor: 'transparent'
            }}
        >
            <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
                <ThemeToggle />
            </Box>

            <Box sx={{ my: 8 }}>
                <Paper
                    elevation={3}
                    sx={{
                        p: 4,
                        backgroundColor: theme.palette.background.paper
                    }}
                >
                    <Typography variant="h4" component="h1" align="center" gutterBottom>
                        Create Estimation Room
                    </Typography>

                    <Typography variant="body1" align="center" sx={{ mb: 4 }}>
                        Create a new room to start estimating with your team
                    </Typography>

                    {error && (
                        <Alert severity="error" sx={{ mb: 3 }}>
                            {error}
                        </Alert>
                    )}

                    <Box component="form" onSubmit={handleCreateRoom}>
                        <TextField
                            fullWidth
                            label="Your Name"
                            value={hostName}
                            onChange={(e) => setHostName(e.target.value)}
                            margin="normal"
                            required
                            autoFocus
                        />

                        <TextField
                            fullWidth
                            label="Room Name"
                            value={roomName}
                            onChange={(e) => setRoomName(e.target.value)}
                            margin="normal"
                            required
                        />

                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            color="primary"
                            size="large"
                            disabled={isLoading || !roomName || !hostName}
                            sx={{ mt: 3 }}
                        >
                            {isLoading ? <CircularProgress size={24} /> : 'Create Room'}
                        </Button>

                        <Box sx={{ mt: 3, textAlign: 'center' }}>
                            <Typography
                                variant="body2"
                                color="primary"
                                sx={{ cursor: 'pointer' }}
                                onClick={() => router.push('/')}
                            >
                                Back to Home
                            </Typography>
                        </Box>
                    </Box>
                </Paper>
            </Box>
        </Container>
    );
};

export default CreateRoomPage;