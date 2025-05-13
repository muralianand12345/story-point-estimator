"use client";

import React from 'react';
import {
    Container,
    Typography,
    Box,
    Button,
    Paper,
    Divider,
    useTheme as useMuiTheme
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import LoginIcon from '@mui/icons-material/Login';
import { useRouter } from 'next/navigation';

const HomePage = () => {
    const theme = useMuiTheme();
    const router = useRouter();

    const handleCreateRoom = async () => {
        try {
            const response = await fetch('/api/rooms/create', {
                method: 'POST',
            });

            if (response.ok) {
                const { roomId } = await response.json();
                router.push(`/room/${roomId}`);
            } else {
                console.error('Failed to create room');
            }
        } catch (error) {
            console.error('Error creating room:', error);
        }
    };

    const handleJoinRoom = () => {
        router.push('/join');
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
                        borderRadius: 4,
                        textAlign: 'center'
                    }}
                >
                    <Typography variant="h1" component="h1" gutterBottom>
                        Story Point Estimator
                    </Typography>

                    <Typography variant="body1" color="text.secondary" paragraph sx={{ mb: 4 }}>
                        Plan your sprints more effectively with real-time collaborative story point estimation.
                        Create or join a room to start estimating with your team.
                    </Typography>

                    <Divider sx={{ my: 4 }} />

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Button
                            variant="contained"
                            size="large"
                            color="primary"
                            startIcon={<AddIcon />}
                            onClick={handleCreateRoom}
                            fullWidth
                            sx={{ py: 1.5 }}
                        >
                            Create a Room
                        </Button>

                        <Button
                            variant="outlined"
                            size="large"
                            startIcon={<LoginIcon />}
                            onClick={handleJoinRoom}
                            fullWidth
                            sx={{ py: 1.5 }}
                        >
                            Join a Room
                        </Button>
                    </Box>
                </Paper>
            </Box>
        </Container>
    );
};

export default HomePage;