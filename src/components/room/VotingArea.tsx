'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Typography,
    Button,
    Paper,
    Divider,
    TextField,
    Chip,
    Snackbar,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import VotingCard from './VotingCard';
import VotingResults from './VotingResults';
import socketService from '@/lib/socketService';
import { User, Vote, SocketEvent } from '@/types';

interface VotingAreaProps {
    users: User[];
    currentUserId: string;
    isHost: boolean;
    roomId: string;
}

const VotingArea: React.FC<VotingAreaProps> = ({
    users,
    currentUserId,
    isHost,
    roomId
}) => {
    const [selectedValue, setSelectedValue] = useState<number | string | null>(null);
    const [votes, setVotes] = useState<Record<string, Vote>>({});
    const [isRevealed, setIsRevealed] = useState<boolean>(false);
    const [currentIssue, setCurrentIssue] = useState<string>('');
    const [issueInput, setIssueInput] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [connectionStatus, setConnectionStatus] = useState<boolean>(false);
    const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
    const [confirmRevealDialog, setConfirmRevealDialog] = useState<boolean>(false);
    const [confirmResetDialog, setConfirmResetDialog] = useState<boolean>(false);
    const [votedCount, setVotedCount] = useState<number>(0);
    const [totalUsers, setTotalUsers] = useState<number>(users.length);

    // Fibonacci-like sequence for story points
    const pointValues = [0, 0.5, 1, 2, 3, 5, 8, 13, 20, 40, 100, '?', 'Pass'];

    // Show notification
    const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
        setNotification({ type, message });
    };

    // Close notification
    const closeNotification = () => {
        setNotification(null);
    };

    // Update user counts whenever users change
    useEffect(() => {
        setTotalUsers(users.length);
    }, [users]);

    // Update voted count whenever votes change
    useEffect(() => {
        setVotedCount(Object.keys(votes).length);
    }, [votes]);

    // Ensure socket connection is active and perform regular checks
    useEffect(() => {
        if (!currentUserId || !roomId) return;

        console.log(`Checking socket connection for user ${currentUserId} in room ${roomId}`);

        // Check connection status
        const isConnected = socketService.isConnected();
        setConnectionStatus(isConnected);

        if (!isConnected) {
            console.log("Socket not connected. Connecting...");
            try {
                socketService.connect(roomId, currentUserId);
                setTimeout(() => {
                    if (socketService.isConnected()) {
                        setConnectionStatus(true);
                        showNotification('success', 'Connected to room successfully');
                    } else {
                        setConnectionStatus(false);
                        showNotification('error', 'Could not connect to room');
                    }
                }, 1000);
            } catch (error) {
                console.error("Failed to connect socket:", error);
                setConnectionStatus(false);
                showNotification('error', 'Failed to connect to room');
            }
        }

        // Set up periodic connection check
        const intervalId = setInterval(() => {
            const connected = socketService.isConnected();

            // Only update state if the connection status has changed
            if (connected !== connectionStatus) {
                setConnectionStatus(connected);

                if (!connected) {
                    console.log("Socket disconnected. Reconnecting...");
                    showNotification('info', 'Connection lost. Reconnecting...');
                    try {
                        socketService.connect(roomId, currentUserId);
                    } catch (err) {
                        console.error("Reconnection failed:", err);
                        showNotification('error', 'Reconnection failed');
                    }
                } else {
                    showNotification('success', 'Connection restored');
                }
            }
        }, 5000);

        return () => clearInterval(intervalId);
    }, [currentUserId, roomId, connectionStatus]);

    // Handle votes updated event - made into useCallback to avoid recreation
    const handleVotesUpdated = useCallback((updatedVotes: Record<string, Vote>) => {
        console.log("Received updated votes:", updatedVotes);

        // Update votes with server data
        setVotes(updatedVotes);
        setVotedCount(Object.keys(updatedVotes).length);

        // Update selected value based on current user's vote
        const userVote = updatedVotes[currentUserId];
        if (userVote) {
            if (userVote.value === null) {
                setSelectedValue('Pass');
            } else if (userVote.value === -1) {
                setSelectedValue('?');
            } else {
                setSelectedValue(userVote.value);
            }
        }
    }, [currentUserId]);

    // Handle votes revealed event
    const handleVotesRevealed = useCallback((revealed: boolean) => {
        console.log("Votes revealed event received:", revealed);
        setIsRevealed(revealed);

        if (revealed) {
            showNotification('info', 'Votes have been revealed');
        }
    }, []);

    // Handle votes reset event
    const handleVotesReset = useCallback(() => {
        console.log("Votes reset event received");
        setVotes({});
        setSelectedValue(null);
        setIsRevealed(false);
        setVotedCount(0);
        showNotification('info', 'Votes have been reset');
    }, []);

    // Handle issue updated event
    const handleIssueUpdated = useCallback((issue: string) => {
        console.log("Issue updated event received:", issue);
        setCurrentIssue(issue);
        // Clear input when issue is updated (especially useful for the host)
        setIssueInput('');

        if (issue) {
            showNotification('info', 'New issue set: ' + issue);
        }
    }, []);

    // Register socket event handlers
    useEffect(() => {
        if (!currentUserId || !roomId) return;

        console.log("Setting up socket event listeners");

        // Make sure we're connected first
        if (!socketService.isConnected()) {
            socketService.connect(roomId, currentUserId);
        }

        // Register all event listeners
        socketService.on(SocketEvent.VOTES_UPDATED, handleVotesUpdated);
        socketService.on(SocketEvent.REVEAL_VOTES, handleVotesRevealed);
        socketService.on(SocketEvent.RESET_VOTES, handleVotesReset);
        socketService.on(SocketEvent.ISSUE_UPDATED, handleIssueUpdated);

        // Register for user joined event
        socketService.on(SocketEvent.USER_JOINED, (userId: string) => {
            console.log(`User joined: ${userId}`);
            showNotification('info', 'A new user has joined the room');

            // Request updated votes when a user joins
            socketService.requestRoomState();
        });

        // Register for user left event
        socketService.on(SocketEvent.USER_LEFT, (userId: string) => {
            console.log(`User left: ${userId}`);
            showNotification('info', 'A user has left the room');

            // Request updated votes when a user leaves
            socketService.requestRoomState();
        });

        // Register for kicked event
        socketService.on(SocketEvent.KICKED, () => {
            console.log('You have been kicked from the room');
            showNotification('error', 'You have been kicked from the room');
        });

        // Manual request to get the current state
        socketService.requestRoomState();

        return () => {
            // Clean up event listeners to avoid memory leaks
            socketService.off(SocketEvent.VOTES_UPDATED);
            socketService.off(SocketEvent.REVEAL_VOTES);
            socketService.off(SocketEvent.RESET_VOTES);
            socketService.off(SocketEvent.ISSUE_UPDATED);
            socketService.off(SocketEvent.USER_JOINED);
            socketService.off(SocketEvent.USER_LEFT);
            socketService.off(SocketEvent.KICKED);
        };
    }, [
        currentUserId,
        roomId,
        handleVotesUpdated,
        handleVotesRevealed,
        handleVotesReset,
        handleIssueUpdated
    ]);

    // Improved vote handler
    const handleVote = (value: number | string) => {
        // Don't allow voting if votes are revealed or already submitting
        if (isRevealed || isSubmitting) return;

        console.log(`Vote initiated for value: ${value}`);

        // Mark as submitting to prevent double-votes
        setIsSubmitting(true);

        // Process value for server
        let serverValue: number | null = null;
        if (value === 'Pass') {
            serverValue = null;
        } else if (value === '?') {
            serverValue = -1;
        } else {
            serverValue = Number(value);
        }

        // Update UI immediately for responsiveness
        setSelectedValue(value);

        // Set a temporary local vote for immediate feedback
        const tempUserVote = {
            userId: currentUserId,
            value: serverValue
        };

        setVotes(prev => {
            const newVotes = {
                ...prev,
                [currentUserId]: tempUserVote
            };
            setVotedCount(Object.keys(newVotes).length);
            return newVotes;
        });

        // Submit to server
        try {
            if (!socketService.isConnected()) {
                console.error("Socket not connected, attempting to reconnect...");
                socketService.connect(roomId, currentUserId);

                // Give it some time to connect
                setTimeout(() => {
                    if (socketService.isConnected()) {
                        socketService.submitVote(serverValue);
                        console.log(`Vote sent to server after reconnection: ${serverValue}`);
                    } else {
                        console.error("Failed to reconnect socket for vote");
                        showNotification('error', 'Failed to submit vote - connection error');
                    }
                }, 500);
            } else {
                socketService.submitVote(serverValue);
                console.log(`Vote sent to server: ${serverValue}`);
                showNotification('success', `Vote submitted: ${value}`);
            }
        } catch (error) {
            console.error("Error submitting vote:", error);
            showNotification('error', 'Error submitting vote');
        }

        // Reset submitting state after a short delay
        setTimeout(() => setIsSubmitting(false), 300);
    };

    // Open confirm reveal dialog
    const openRevealDialog = () => {
        setConfirmRevealDialog(true);
    };

    // Close confirm reveal dialog
    const closeRevealDialog = () => {
        setConfirmRevealDialog(false);
    };

    // Open confirm reset dialog
    const openResetDialog = () => {
        setConfirmResetDialog(true);
    };

    // Close confirm reset dialog
    const closeResetDialog = () => {
        setConfirmResetDialog(false);
    };

    // Reveal votes (host only)
    const handleRevealVotes = () => {
        if (!isHost || isRevealed) return;

        closeRevealDialog();

        try {
            console.log("Revealing votes...");

            if (!socketService.isConnected()) {
                showNotification('error', 'Cannot reveal votes - connection error');
                return;
            }

            socketService.revealVotes(true);
            showNotification('info', 'Revealing votes...');

            // Local update immediately for better UX
            setIsRevealed(true);
        } catch (error) {
            console.error("Error revealing votes:", error);
            showNotification('error', 'Error revealing votes');
        }
    };

    // Reset votes (host only)
    const handleResetVotes = () => {
        if (!isHost) return;

        closeResetDialog();

        try {
            console.log("Resetting votes...");

            if (!socketService.isConnected()) {
                showNotification('error', 'Cannot reset votes - connection error');
                return;
            }

            socketService.resetVotes();
            showNotification('info', 'Resetting votes...');

            // Local immediate update for better UX
            setVotes({});
            setSelectedValue(null);
            setIsRevealed(false);
            setVotedCount(0);
        } catch (error) {
            console.error("Error resetting votes:", error);
            showNotification('error', 'Error resetting votes');
        }
    };

    // Update issue (host only) - improved with error handling
    const handleUpdateIssue = () => {
        if (!isHost || !issueInput.trim()) return;

        console.log(`Updating issue: ${issueInput}`);

        try {
            if (!socketService.isConnected()) {
                showNotification('error', 'Cannot set issue - connection error');
                return;
            }

            socketService.updateIssue(issueInput.trim());
            showNotification('success', 'Issue updated');

            // Update local state immediately for better UX
            setCurrentIssue(issueInput.trim());
            setIssueInput('');
        } catch (error) {
            console.error("Error updating issue:", error);
            showNotification('error', 'Error updating issue');
        }
    };

    // Determine user vote display
    const userVote = votes[currentUserId];
    const hasUserVoted = !!userVote;

    return (
        <>
            <Paper sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Typography variant="h5" gutterBottom>
                            Story Point Estimation
                        </Typography>
                        {!connectionStatus &&
                            <Chip
                                size="small"
                                color="error"
                                label="Disconnected"
                                sx={{ ml: 2 }}
                            />
                        }
                    </Box>

                    {isHost && (
                        <Box sx={{ mb: 2, display: 'flex' }}>
                            <TextField
                                fullWidth
                                label="Current Issue/Story"
                                placeholder="Enter issue or story title"
                                value={issueInput}
                                onChange={(e) => setIssueInput(e.target.value)}
                                size="small"
                                sx={{ mr: 1 }}
                            />
                            <Button
                                variant="contained"
                                onClick={handleUpdateIssue}
                                disabled={!issueInput.trim() || !connectionStatus}
                            >
                                Set
                            </Button>
                        </Box>
                    )}

                    {currentIssue && (
                        <Paper
                            elevation={1}
                            sx={{
                                p: 2,
                                mb: 2,
                                backgroundColor: (theme) =>
                                    theme.palette.mode === 'light' ? '#f9f9f9' : '#2a2a2a'
                            }}
                        >
                            <Typography variant="h6">
                                {currentIssue}
                            </Typography>
                        </Paper>
                    )}

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Chip
                            label={`${votedCount} of ${totalUsers} voted`}
                            color="primary"
                            variant="outlined"
                        />
                        {isHost && (
                            <Box>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    startIcon={<VisibilityIcon />}
                                    onClick={openRevealDialog}
                                    disabled={isRevealed || votedCount === 0 || !connectionStatus}
                                    sx={{ mr: 1 }}
                                >
                                    Reveal Votes
                                </Button>
                                <Button
                                    variant="outlined"
                                    startIcon={<RestartAltIcon />}
                                    onClick={openResetDialog}
                                    disabled={(!isRevealed && votedCount === 0) || !connectionStatus}
                                >
                                    Reset
                                </Button>
                            </Box>
                        )}
                    </Box>
                </Box>

                <Divider sx={{ mb: 3 }} />

                {isRevealed ? (
                    <VotingResults votes={votes} users={users} />
                ) : (
                    <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle1" gutterBottom>
                                Your vote: {hasUserVoted
                                    ? (userVote.value === null ? 'Pass' : userVote.value === -1 ? '?' : userVote.value)
                                    : 'Not submitted'}
                            </Typography>
                        </Box>

                        <Box sx={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            justifyContent: 'center',
                            alignItems: 'center',
                            p: 2
                        }}>
                            {pointValues.map((value) => {
                                // Determine if this card should be selected
                                const isSelected = hasUserVoted
                                    ? (userVote.value === null && value === 'Pass') ||
                                    (userVote.value === -1 && value === '?') ||
                                    userVote.value === value
                                    : selectedValue === value;

                                return (
                                    <VotingCard
                                        key={value}
                                        value={value}
                                        selected={isSelected}
                                        onSelect={() => handleVote(value)}
                                        revealed={isRevealed}
                                        disabled={isSubmitting || !connectionStatus}
                                    />
                                );
                            })}
                        </Box>
                    </Box>
                )}
            </Paper>

            {/* Notification system */}
            {notification && (
                <Snackbar
                    open={true}
                    autoHideDuration={3000}
                    onClose={closeNotification}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                >
                    <Alert
                        onClose={closeNotification}
                        severity={notification.type}
                        sx={{ width: '100%' }}
                    >
                        {notification.message}
                    </Alert>
                </Snackbar>
            )}

            {/* Reveal votes confirmation dialog */}
            <Dialog
                open={confirmRevealDialog}
                onClose={closeRevealDialog}
                aria-labelledby="reveal-dialog-title"
                aria-describedby="reveal-dialog-description"
            >
                <DialogTitle id="reveal-dialog-title">
                    Reveal Votes?
                </DialogTitle>
                <DialogContent>
                    <DialogContentText id="reveal-dialog-description">
                        Are you sure you want to reveal all votes? This cannot be undone, though you can reset votes afterward.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={closeRevealDialog}>Cancel</Button>
                    <Button onClick={handleRevealVotes} color="primary" variant="contained">
                        Reveal Votes
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Reset votes confirmation dialog */}
            <Dialog
                open={confirmResetDialog}
                onClose={closeResetDialog}
                aria-labelledby="reset-dialog-title"
                aria-describedby="reset-dialog-description"
            >
                <DialogTitle id="reset-dialog-title">
                    Reset Votes?
                </DialogTitle>
                <DialogContent>
                    <DialogContentText id="reset-dialog-description">
                        Are you sure you want to reset all votes? This will clear all current votes and allow everyone to vote again.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={closeResetDialog}>Cancel</Button>
                    <Button onClick={handleResetVotes} color="primary" variant="contained">
                        Reset Votes
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default VotingArea;