"use client";

import React, { useState } from 'react';
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
    useTheme as useMuiTheme
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ContentPasteIcon from '@mui/icons-material/ContentPaste';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const JoinRoomPage = () => {
    const theme = useMuiTheme();
    const router = useRouter();
    const [roomCode, setRoomCode] = useState('');
    const [error, setError] = useState('');

    const handleRoomCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setRoomCode(e.target.value.trim());
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

        try {
            const response = await fetch(`/api/rooms/validate?roomId=${roomCode}`);

            if (response.ok) {
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
                        Enter the room code or paste the invite link to join an existing estimation session.
                    </Typography>

                    {error && (
                        <Alert severity="error" sx={{ my: 2 }}>
                            {error}
                        </Alert>
                    )}

                    <TextField
                        fullWidth
                        label="Room Code"
                        variant="outlined"
                        value={roomCode}
                        onChange={handleRoomCodeChange}
                        margin="normal"
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
                </Paper>
            </Box>
        </Container>
    );
};

export default JoinRoomPage;