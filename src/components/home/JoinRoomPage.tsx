"use client";

import React, { useState, useEffect } from 'react';
import {
    Container,
    Typography,
    Box,
    TextField,
    Button,
    Paper,
    InputAdornment,
    IconButton,
    Alert,
    Stack,
    useTheme
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ContentPasteIcon from '@mui/icons-material/ContentPaste';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const JoinRoomPage = () => {
    const theme = useTheme();
    const router = useRouter();
    const [roomCode, setRoomCode] = useState('');
    const [userName, setUserName] = useState('');
    const [error, setError] = useState('');

    // Load saved username if available
    useEffect(() => {
        const savedName = localStorage.getItem('userName');
        if (savedName) {
            setUserName(savedName);
        }
    }, []);

    const handleRoomCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setRoomCode(e.target.value.trim());
        setError('');
    };

    const handleUserNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setUserName(e.target.value);
        setError('');
    };

    const handlePasteFromClipboard = async () => {
        try {
            const text = await navigator.clipboard.readText();
            // Check if text is a URL containing a room ID
            const match = text.match(/\/room\/([a-zA-Z0-9-]+)/);
            if (match) {
                setRoomCode(match[1]);
            } else {
                setRoomCode(text.trim());
            }
            setError('');
        } catch (err) {
            console.error('Failed to read clipboard:', err);
        }
    };

    const handleJoinRoom = async () => {
        if (!roomCode) {
            setError('Please enter a room code');
            return;
        }

        if (!userName) {
            setError('Please enter your name');
            return;
        }

        try {
            const response = await fetch(`/api/rooms/validate?roomId=${roomCode}`);

            if (response.ok) {
                // Save username to localStorage
                localStorage.setItem('userName', userName);

                // Navigate to room
                router.push(`/room/${roomCode}`);
            } else {
                setError('Invalid room code. Please check and try again.');
            }
        } catch (error) {
            console.error('Error validating room:', error);
            setError('An error occurred. Please try again.');
        }
    };

    return (
        <Container maxWidth="md">
            <Box
                sx={{
                    minHeight: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    py: 8
                }}
            >
                <Paper
                    elevation={3}
                    sx={{
                        p: 5,
                        width: '100%',
                        maxWidth: 500,
                        borderRadius: 4
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
                        <Link href="/" passHref>
                            <IconButton color="primary" edge="start">
                                <ArrowBackIcon />
                            </IconButton>
                        </Link>
                        <Typography variant="h2" component="h1" sx={{ ml: 1 }}>
                            Join a Room
                        </Typography>
                    </Box>

                    <Typography variant="body1" color="text.secondary" paragraph>
                        Enter your name and the room code or paste the invite link to join an existing estimation session.
                    </Typography>

                    {error && (
                        <Alert severity="error" sx={{ my: 2 }}>
                            {error}
                        </Alert>
                    )}

                    <Stack spacing={3} sx={{ mt: 3 }}>
                        <TextField
                            fullWidth
                            label="Your Name"
                            variant="outlined"
                            value={userName}
                            onChange={handleUserNameChange}
                            autoFocus
                            required
                        />

                        <TextField
                            fullWidth
                            label="Room Code"
                            variant="outlined"
                            value={roomCode}
                            onChange={handleRoomCodeChange}
                            placeholder="Enter room code..."
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton onClick={handlePasteFromClipboard} edge="end">
                                            <ContentPasteIcon />
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                            onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                    handleJoinRoom();
                                }
                            }}
                        />

                        <Button
                            variant="contained"
                            fullWidth
                            size="large"
                            sx={{ mt: 3, py: 1.5 }}
                            onClick={handleJoinRoom}
                            endIcon={<ArrowForwardIcon />}
                        >
                            Join Room
                        </Button>
                    </Stack>
                </Paper>
            </Box>
        </Container>
    );
};

export default JoinRoomPage;