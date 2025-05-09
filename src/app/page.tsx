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
    Tab,
    Tabs,
    AppBar,
    Divider,
    useTheme
} from '@mui/material';
import ThemeToggle from '@/components/ui/ThemeToggle';

const HomePage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<number>(0);
    const [roomName, setRoomName] = useState<string>('');
    const [hostName, setHostName] = useState<string>('');
    const [joinName, setJoinName] = useState<string>('');
    const [roomCode, setRoomCode] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const router = useRouter();
    const theme = useTheme();

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setActiveTab(newValue);
        setError('');
    };

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

    const handleJoinByCode = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            // First find room by code
            const findResponse = await fetch(`/api/room/code/${roomCode}`);

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
                body: JSON.stringify({ userName: joinName }),
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
                        Story Point Estimator
                    </Typography>

                    <Typography variant="body1" align="center" sx={{ mb: 4 }}>
                        Create a room or join an existing one to start estimating with your team
                    </Typography>

                    {error && (
                        <Alert severity="error" sx={{ mb: 3 }}>
                            {error}
                        </Alert>
                    )}

                    <AppBar position="static" color="default" elevation={0}>
                        <Tabs
                            value={activeTab}
                            onChange={handleTabChange}
                            indicatorColor="primary"
                            textColor="primary"
                            variant="fullWidth"
                        >
                            <Tab label="Create Room" />
                            <Tab label="Join Room" />
                        </Tabs>
                    </AppBar>

                    <Box sx={{ mt: 3 }}>
                        {activeTab === 0 && (
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
                        )}

                        {activeTab === 1 && (
                            <Box component="form" onSubmit={handleJoinByCode}>
                                <TextField
                                    fullWidth
                                    label="Your Name"
                                    value={joinName}
                                    onChange={(e) => setJoinName(e.target.value)}
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
                                    disabled={isLoading || !joinName || !roomCode || roomCode.length !== 6}
                                    sx={{ mt: 3 }}
                                >
                                    {isLoading ? <CircularProgress size={24} /> : 'Join Room'}
                                </Button>
                            </Box>
                        )}
                    </Box>
                </Paper>
            </Box>
        </Container>
    );
};

export default HomePage;