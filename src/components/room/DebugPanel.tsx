'use client';

import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Button, Chip, TextField, Stack } from '@mui/material';
import socketService from '@/lib/socketService';

const DebugPanel: React.FC<{ userId: string, roomId: string }> = ({ userId, roomId }) => {
    const [wsStatus, setWsStatus] = useState<string>('Checking...');
    const [lastEvent, setLastEvent] = useState<string>('None');
    const [testVote, setTestVote] = useState<string>('');

    useEffect(() => {
        const checkConnection = () => {
            const status = socketService.isConnected() ? 'Connected' : 'Disconnected';
            setWsStatus(status);
        };

        // Listen for debug events
        socketService.on('debug-event', (data) => {
            setLastEvent(JSON.stringify(data));
        });

        // Check initially and periodically
        checkConnection();
        const interval = setInterval(checkConnection, 2000);

        return () => {
            clearInterval(interval);
            socketService.off('debug-event');
        };
    }, []);

    const reconnectSocket = () => {
        socketService.disconnect();
        setTimeout(() => {
            socketService.connect(roomId, userId);
        }, 500);
    };

    return (
        <Paper sx={{ p: 2, mt: 2 }}>
            <Typography variant="h6">WebSocket Debug</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2">Status:</Typography>
                    <Chip
                        label={wsStatus}
                        color={wsStatus === 'Connected' ? 'success' : 'error'}
                        size="small"
                    />
                </Box>
                <Typography variant="body2">User ID: {userId}</Typography>
                <Typography variant="body2">Room ID: {roomId}</Typography>
                <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                    Last Event: {lastEvent}
                </Typography>
                <Button
                    variant="outlined"
                    size="small"
                    onClick={reconnectSocket}
                    sx={{ mt: 1, alignSelf: 'flex-start' }}
                >
                    Reconnect WebSocket
                </Button>
                <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                    <TextField
                        label="Test Vote Value"
                        size="small"
                        value={testVote}
                        onChange={(e) => setTestVote(e.target.value)}
                        sx={{ width: 120 }}
                    />
                    <Button
                        variant="contained"
                        size="small"
                        onClick={() => {
                            const value = testVote === 'null' ? null : Number(testVote);
                            socketService.submitVote(value);
                            setLastEvent(`{"type":"manual-vote-sent","value":${testVote}}`);
                        }}
                    >
                        Send Vote
                    </Button>
                </Stack>
            </Box>
        </Paper>
    );
};

export default DebugPanel;