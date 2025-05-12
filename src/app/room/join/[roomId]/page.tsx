'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
import apiService from '@/lib/apiService';

const JoinRoomPage: React.FC = () => {
    const { roomId } = useParams<{ roomId: string }>();
    const [userName, setUserName] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isJoining, setIsJoining] = useState<boolean>(false);
    const [roomExists, setRoomExists] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const router = useRouter();

    useEffect(() => {
        const checkRoom = async () => {
            try {
                const data = await apiService.checkRoom(roomId as string);
                setRoomExists(data.exists);
                setIsLoading(false);
            } catch (error) {
                console.error('Error checking room:', error);
                setError('Failed to check if room exists');
                setRoomExists(false);
                setIsLoading(false);
            }
        };

        checkRoom();
    }, [roomId]);

    const handleJoinRoom = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsJoining(true);
        setError('');

        try {
            const data = await apiService.joinRoom(roomId as string, { userName });

            // Store user data in localStorage
            localStorage.setItem('userId', data.userId);
            localStorage.setItem('userName', data.userName);

            // Redirect to room page
            router.push(`/room/${roomId}`);
        } catch (error) {
            console.error('Error joining room:', error);
            setError(error instanceof Error ? error.message : 'Failed to join room');
            setIsJoining(false);
        }
    };

    if (isLoading) {
        return (
            <Container maxWidth="sm">
                <Box sx={{
                    my: 8,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center'
                }}>
                    <CircularProgress />
                    <Typography variant="body1" sx={{ mt: 2 }}>
                        Checking room status...
                    </Typography>
                </Box>
            </Container>
        );
    }

    if (!roomExists) {
        return (
            <Container maxWidth="sm">
                <Box sx={{ my: 8 }}>
                    <Paper elevation={3} sx={{ p: 4 }}>
                        <Typography variant="h5" align="center" color="error" gutterBottom>
                            Room Not Found
                        </Typography>
                        <Typography variant="body1" align="center" paragraph>
                            The room you're trying to join doesn't exist or is no longer active.
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={() => router.push('/')}
                            >
                                Create a New Room
                            </Button>
                        </Box>
                    </Paper>
                </Box>
            </Container>
        );
    }

    return (
        <Container maxWidth="sm">
            <Box sx={{ my: 8 }}>
                <Paper elevation={3} sx={{ p: 4 }}>
                    <Typography variant="h4" component="h1" align="center" gutterBottom>
                        Join Estimation Room
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

                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            color="primary"
                            size="large"
                            disabled={isJoining || !userName}
                            sx={{ mt: 3 }}
                        >
                            {isJoining ? <CircularProgress size={24} /> : 'Join Room'}
                        </Button>
                    </Box>
                </Paper>
            </Box>
        </Container>
    );
};

export default JoinRoomPage;