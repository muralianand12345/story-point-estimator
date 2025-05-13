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
    const [confirmRevealDialog, setConfirmRevealDialog] = useState<boolean>(false);
    const [confirmResetDialog, setConfirmResetDialog] = useState<boolean>(false);
    const [votedCount, setVotedCount] = useState<number>(0);
    const [totalUsers, setTotalUsers] = useState<number>(users.length);

    // Fibonacci-like sequence for story points
    const pointValues = [0, 0.5, 1, 2, 3, 5, 8, 13, 20, 40, 100, '?', 'Pass'];

    // Update user counts whenever users change
    useEffect(() => {
        setTotalUsers(users.length);
    }, [users]);

    // Update voted count whenever votes change
    useEffect(() => {
        setVotedCount(Object.keys(votes).length);
    }, [votes]);

    // Ensure socket connection is active
    useEffect(() => {
        if (!currentUserId || !roomId) return;

        // Check connection status
        const isConnected = socketService.isConnected();
        setConnectionStatus(isConnected);

        if (!isConnected) {
            try {
                socketService.connect(roomId, currentUserId);
                setTimeout(() => {
                    setConnectionStatus(socketService.isConnected());
                }, 1000);
            } catch (error) {
                console.error("Failed to connect socket:", error);
                setConnectionStatus(false);
            }
        }

        // Set up periodic connection check
        const intervalId = setInterval(() => {
            const connected = socketService.isConnected();
            if (connected !== connectionStatus) {
                setConnectionStatus(connected);
                if (!connected) {
                    try {
                        socketService.connect(roomId, currentUserId);
                    } catch (err) {
                        console.error("Reconnection failed:", err);
                    }
                }
            }
        }, 5000);

        return () => clearInterval(intervalId);
    }, [currentUserId, roomId, connectionStatus]);

    // Handle votes updated event
    const handleVotesUpdated = useCallback((updatedVotes: Record<string, Vote>) => {
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
        setIsRevealed(revealed);
    }, []);

    // Handle votes reset event
    const handleVotesReset = useCallback(() => {
        setVotes({});
        setSelectedValue(null);
        setIsRevealed(false);
        setVotedCount(0);
    }, []);

    // Handle issue updated event
    const handleIssueUpdated = useCallback((issue: string) => {
        setCurrentIssue(issue);
        setIssueInput('');
    }, []);

    // Register socket event handlers
    useEffect(() => {
        if (!currentUserId || !roomId) return;

        // Make sure we're connected first
        if (!socketService.isConnected()) {
            socketService.connect(roomId, currentUserId);
        }

        // Register all event listeners
        socketService.on(SocketEvent.VOTES_UPDATED, handleVotesUpdated);
        socketService.on(SocketEvent.REVEAL_VOTES, handleVotesRevealed);
        socketService.on(SocketEvent.RESET_VOTES, handleVotesReset);
        socketService.on(SocketEvent.ISSUE_UPDATED, handleIssueUpdated);

        // Register for user events
        socketService.on(SocketEvent.USER_JOINED, () => {
            socketService.requestRoomState();
        });

        socketService.on(SocketEvent.USER_LEFT, () => {
            socketService.requestRoomState();
        });

        // Manual request to get the current state
        socketService.requestRoomState();

        return () => {
            // Clean up event listeners
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

    // Vote handler
    const handleVote = (value: number | string) => {
        if (isRevealed || isSubmitting) return;

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

        // Submit to server with retry logic
        const submitWithRetry = (attempts = 0) => {
            try {
                if (!socketService.isConnected()) {
                    if (attempts < 3) {
                        console.log(`Socket disconnected, attempting to reconnect (${attempts + 1}/3)`);
                        socketService.connect(roomId, currentUserId);
                        setTimeout(() => submitWithRetry(attempts + 1), 500);
                        return;
                    } else {
                        console.error("Failed to connect after 3 attempts");
                    }
                } else {
                    socketService.submitVote(serverValue);
                    console.log(`Vote submitted: ${serverValue}`);
                }
            } catch (error) {
                console.error("Error submitting vote:", error);
                if (attempts < 3) {
                    setTimeout(() => submitWithRetry(attempts + 1), 500);
                }
            }
        };

        submitWithRetry();

        // Reset submitting state after a short delay
        setTimeout(() => setIsSubmitting(false), 300);
    };

    // Dialog handlers
    const openRevealDialog = () => setConfirmRevealDialog(true);
    const closeRevealDialog = () => setConfirmRevealDialog(false);
    const openResetDialog = () => setConfirmResetDialog(true);
    const closeResetDialog = () => setConfirmResetDialog(false);

    // Reveal votes (host only)
    const handleRevealVotes = () => {
        if (!isHost || isRevealed) return;
        closeRevealDialog();

        try {
            if (socketService.isConnected()) {
                socketService.revealVotes(true);
                setIsRevealed(true);
            }
        } catch (error) {
            console.error("Error revealing votes:", error);
        }
    };

    // Reset votes (host only)
    const handleResetVotes = () => {
        if (!isHost) return;
        closeResetDialog();

        try {
            if (socketService.isConnected()) {
                socketService.resetVotes();
                setVotes({});
                setSelectedValue(null);
                setIsRevealed(false);
                setVotedCount(0);
            }
        } catch (error) {
            console.error("Error resetting votes:", error);
        }
    };

    // Update issue (host only)
    const handleUpdateIssue = () => {
        if (!isHost || !issueInput.trim()) return;

        try {
            if (socketService.isConnected()) {
                socketService.updateIssue(issueInput.trim());
                setCurrentIssue(issueInput.trim());
                setIssueInput('');
            }
        } catch (error) {
            console.error("Error updating issue:", error);
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