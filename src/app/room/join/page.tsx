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

const JoinRoomPage: React.FC = () => {
    const [roomCode, setRoomCode] = useState<string>('');
    const [userName, setUserName] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const router = useRouter();
    const theme = useTheme();

    const handleJoinRoom = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            // First find room by code
            const findResponse = await fetch(`/api/room/code/${roomCode.toUpperCase()}`);

            if (!findResponse.ok) {
                throw new Error('Invalid room code. Please check and try again.');
            }

            const findData = await findResponse.json();
            const roomId = findData.roomId;

            // Then join the room
            const joinResponse = await fetch(`/api/room/${roomId}/join`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userName }),
            });

            if (!joinResponse.ok) {
                const data = await joinResponse.json();
                throw new Error(data.error || 'Failed to join room');
            }

            const joinData = await joinResponse.json();

            // Store user data in localStorage
            localStorage.setItem('userId', joinData.userId);
            localStorage.setItem('userName', joinData.userName);

            // Redirect to room page
            router.push(`/room/${roomId}`);
        } catch (error) {
            console.error('Error joining room:', error);
            setError(error instanceof Error ? error.message : 'Failed to join room');
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
                        Join Estimation Room
                    </Typography>

                    <Typography variant="body1" align="center" sx={{ mb: 4 }}>
                        Enter a room code to join an existing estimation session
                    </Typography>

                    {error && (
                        <Alert severity="error" sx={{ mb: 3 }}>
                            {error}
                        </Alert>
                    )}

                    <Box component="form" onSubmit={handleJoinRoom}>
                        <TextField
                            fullWidth
                            label="Your Name"
                            value={userName}
                            onChange={(e) => setUserName(e.target.value)}
                            margin="normal"
                            required
                            autoFocus
                        />

                        <TextField
                            fullWidth
                            label="Room Code"
                            value={roomCode}
                            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                            margin="normal"
                            required
                            placeholder="Enter 6-digit code"
                            inputProps={{
                                maxLength: 6,
                                style: { textTransform: 'uppercase' }
                            }}
                        />

                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            color="primary"
                            size="large"
                            disabled={isLoading || !userName || !roomCode || roomCode.length !== 6}
                            sx={{ mt: 3 }}
                        >
                            {isLoading ? <CircularProgress size={24} /> : 'Join Room'}
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

export default JoinRoomPage;