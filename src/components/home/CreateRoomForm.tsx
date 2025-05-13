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
    Stack,
    useTheme
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import { useRouter } from 'next/navigation';

interface CreateRoomFormProps {
    onBack: () => void;
}

const CreateRoomForm = ({ onBack }: CreateRoomFormProps) => {
    const theme = useTheme();
    const router = useRouter();
    const [userName, setUserName] = useState('');
    const [roomName, setRoomName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!userName.trim()) {
            setError('Please enter your name');
            return;
        }

        if (!roomName.trim()) {
            setError('Please enter a room name');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/rooms/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ roomName }),
            });

            if (response.ok) {
                const { roomId } = await response.json();

                // Save user name to localStorage
                localStorage.setItem('userName', userName);

                // Navigate to the room
                router.push(`/room/${roomId}`);
            } else {
                const data = await response.json();
                setError(data.error || 'Failed to create room');
            }
        } catch (err) {
            console.error('Error creating room:', err);
            setError('An unexpected error occurred');
        } finally {
            setLoading(false);
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
                        <IconButton color="primary" onClick={onBack} sx={{ mr: 2 }}>
                            <ArrowBackIcon />
                        </IconButton>
                        <Typography variant="h2" component="h1">
                            Create a Room
                        </Typography>
                    </Box>

                    {error && (
                        <Alert severity="error" sx={{ my: 2 }}>
                            {error}
                        </Alert>
                    )}

                    <form onSubmit={handleSubmit}>
                        <Stack spacing={3}>
                            <TextField
                                label="Your Name"
                                variant="outlined"
                                fullWidth
                                value={userName}
                                onChange={(e) => setUserName(e.target.value)}
                                required
                                autoFocus
                            />

                            <TextField
                                label="Room Name"
                                variant="outlined"
                                fullWidth
                                value={roomName}
                                onChange={(e) => setRoomName(e.target.value)}
                                required
                                placeholder="e.g., Team Sprint Planning"
                            />

                            <Button
                                variant="contained"
                                fullWidth
                                size="large"
                                type="submit"
                                disabled={loading}
                                startIcon={<AddIcon />}
                                sx={{ mt: 2, py: 1.5 }}
                            >
                                {loading ? 'Creating...' : 'Create Room'}
                            </Button>
                        </Stack>
                    </form>
                </Paper>
            </Box>
        </Container>
    );
};

export default CreateRoomForm;