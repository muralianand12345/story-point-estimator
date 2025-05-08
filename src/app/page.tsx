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
    Alert
} from '@mui/material';

const HomePage: React.FC = () => {
    const [roomName, setRoomName] = useState<string>('');
    const [hostName, setHostName] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const router = useRouter();

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
        <Container maxWidth="sm">
            <Box sx={{ my: 8 }}>
                <Paper elevation={3} sx={{ p: 4 }}>
                    <Typography variant="h4" component="h1" align="center" gutterBottom>
                        Story Point Estimator
                    </Typography>

                    <Typography variant="body1" align="center" sx={{ mb: 4 }}>
                        Create a room to start estimating with your team
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
                    </Box>
                </Paper>
            </Box>
        </Container>
    );
};

export default HomePage;