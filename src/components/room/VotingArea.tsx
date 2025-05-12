import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Button,
    Paper,
    Divider,
    TextField,
    Chip
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
}

const VotingArea: React.FC<VotingAreaProps> = ({
    users,
    currentUserId,
    isHost
}) => {
    const [selectedValue, setSelectedValue] = useState<number | string | null>(null);
    const [votes, setVotes] = useState<Record<string, Vote>>({});
    const [isRevealed, setIsRevealed] = useState<boolean>(false);
    const [currentIssue, setCurrentIssue] = useState<string>('');
    const [issueInput, setIssueInput] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [connectionStatus, setConnectionStatus] = useState<boolean>(false);

    // Fibonacci-like sequence for story points
    const pointValues = [0, 0.5, 1, 2, 3, 5, 8, 13, 20, 40, 100, '?', 'Pass'];

    // Ensure socket connection is active
    useEffect(() => {
        if (!currentUserId) return;

        // Check connection status
        const isConnected = socketService.isConnected();
        setConnectionStatus(isConnected);

        if (!isConnected) {
            console.log("Socket not connected. Connecting...");
            try {
                socketService.connect(currentUserId.split('-')[1], currentUserId);
                setConnectionStatus(true);
            } catch (error) {
                console.error("Failed to connect socket:", error);
                setConnectionStatus(false);
            }
        }

        // Set up periodic connection check
        const intervalId = setInterval(() => {
            const connected = socketService.isConnected();
            setConnectionStatus(connected);

            if (!connected) {
                console.log("Socket disconnected. Reconnecting...");
                try {
                    socketService.connect(currentUserId.split('-')[1], currentUserId);
                } catch (err) {
                    console.error("Reconnection failed:", err);
                }
            }
        }, 5000);

        return () => clearInterval(intervalId);
    }, [currentUserId]);

    // Set up socket event listeners
    useEffect(() => {
        // Don't set up listeners if no user ID or not connected
        if (!currentUserId) return;

        console.log("Setting up socket event listeners");

        // Define the event handlers with proper type casting
        const handleVotesUpdated = (updatedVotes: Record<string, Vote>) => {
            console.log("Received updated votes:", updatedVotes);

            // Update votes with server data
            setVotes(updatedVotes);

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
        };

        const handleVotesRevealed = (revealed: boolean) => {
            console.log("Votes revealed event received:", revealed);
            setIsRevealed(revealed);
        };

        const handleVotesReset = () => {
            console.log("Votes reset event received");
            setVotes({});
            setSelectedValue(null);
            setIsRevealed(false);
        };

        const handleIssueUpdated = (issue: string) => {
            console.log("Issue updated event received:", issue);
            setCurrentIssue(issue);
            // Clear input when issue is updated (especially useful for the host)
            setIssueInput('');
        };

        // Register all event listeners
        socketService.on(SocketEvent.VOTES_UPDATED, handleVotesUpdated);
        socketService.on(SocketEvent.REVEAL_VOTES, handleVotesRevealed);
        socketService.on(SocketEvent.RESET_VOTES, handleVotesReset);
        socketService.on(SocketEvent.ISSUE_UPDATED, handleIssueUpdated);

        return () => {
            // Clean up event listeners to avoid memory leaks
            socketService.off(SocketEvent.VOTES_UPDATED);
            socketService.off(SocketEvent.REVEAL_VOTES);
            socketService.off(SocketEvent.RESET_VOTES);
            socketService.off(SocketEvent.ISSUE_UPDATED);
        };
    }, [currentUserId]);

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

        setVotes(prev => ({
            ...prev,
            [currentUserId]: tempUserVote
        }));

        // Submit to server
        try {
            if (!socketService.isConnected()) {
                console.error("Socket not connected, attempting to reconnect...");
                socketService.connect(currentUserId.split('-')[1], currentUserId);

                // Give it some time to connect
                setTimeout(() => {
                    if (socketService.isConnected()) {
                        socketService.submitVote(serverValue);
                        console.log(`Vote sent to server after reconnection: ${serverValue}`);
                    } else {
                        console.error("Failed to reconnect socket for vote");
                    }
                }, 500);
            } else {
                socketService.submitVote(serverValue);
                console.log(`Vote sent to server: ${serverValue}`);
            }
        } catch (error) {
            console.error("Error submitting vote:", error);
        }

        // Reset submitting state after a short delay
        setTimeout(() => setIsSubmitting(false), 300);
    };

    // Reveal votes (host only)
    const handleRevealVotes = () => {
        if (isHost && !isRevealed) {
            try {
                console.log("Revealing votes...");
                socketService.revealVotes(true);
            } catch (error) {
                console.error("Error revealing votes:", error);
            }
        }
    };

    // Reset votes (host only)
    const handleResetVotes = () => {
        if (isHost) {
            try {
                console.log("Resetting votes...");
                socketService.resetVotes();
            } catch (error) {
                console.error("Error resetting votes:", error);
            }
        }
    };

    // Update issue (host only) - improved with error handling
    const handleUpdateIssue = () => {
        if (!isHost || !issueInput.trim()) return;

        console.log(`Updating issue: ${issueInput}`);

        try {
            if (!socketService.isConnected()) {
                console.error("Socket not connected for issue update");
                socketService.connect(currentUserId.split('-')[1], currentUserId);

                setTimeout(() => {
                    if (socketService.isConnected()) {
                        socketService.updateIssue(issueInput.trim());
                    } else {
                        console.error("Failed to reconnect for issue update");
                    }
                }, 500);
            } else {
                socketService.updateIssue(issueInput.trim());
            }
        } catch (error) {
            console.error("Error updating issue:", error);
        }
    };

    // Count votes and check user status
    const votedCount = Object.keys(votes).length;
    const totalUsers = users.length;
    const userVote = votes[currentUserId];
    const hasUserVoted = !!userVote;

    return (
        <Paper sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ mb: 3 }}>
                <Typography variant="h5" gutterBottom>
                    Story Point Estimation
                    {!connectionStatus &&
                        <Chip
                            size="small"
                            color="error"
                            label="Disconnected"
                            sx={{ ml: 2 }}
                        />
                    }
                </Typography>

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
                                onClick={handleRevealVotes}
                                disabled={isRevealed || votedCount === 0 || !connectionStatus}
                                sx={{ mr: 1 }}
                            >
                                Reveal Votes
                            </Button>
                            <Button
                                variant="outlined"
                                startIcon={<RestartAltIcon />}
                                onClick={handleResetVotes}
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
    );
};

export default VotingArea;