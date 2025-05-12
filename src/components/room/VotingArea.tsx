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

    // Fibonacci-like sequence for story points
    const pointValues = [0, 0.5, 1, 2, 3, 5, 8, 13, 20, 40, 100, '?', 'Pass'];

    // Set up socket event listeners
    useEffect(() => {
        // Don't get the raw socket - use the socketService methods directly
        if (!socketService.isConnected()) return;

        // Listen for vote updates using socketService.on()
        socketService.on(SocketEvent.VOTES_UPDATED, (updatedVotes: Record<string, Vote>) => {
            setVotes(updatedVotes);
        });

        // Listen for vote reveal
        socketService.on(SocketEvent.REVEAL_VOTES, (revealed: boolean) => {
            setIsRevealed(revealed);
        });

        // Listen for vote reset
        socketService.on(SocketEvent.RESET_VOTES, () => {
            // Important: clear ALL states
            setSelectedValue(null);
            setVotes({});
            setIsRevealed(false);
            setIsSubmitting(false);
        });

        // Listen for issue updates
        socketService.on(SocketEvent.ISSUE_UPDATED, (issue: string) => {
            setCurrentIssue(issue);
        });

        return () => {
            // Clean up event listeners
            socketService.off(SocketEvent.VOTES_UPDATED);
            socketService.off(SocketEvent.REVEAL_VOTES);
            socketService.off(SocketEvent.RESET_VOTES);
            socketService.off(SocketEvent.ISSUE_UPDATED);
        };
    }, []);

    // Simplified vote handler
    const handleVote = (value: number | string) => {
        // Don't allow voting if votes are revealed or already submitting
        if (isRevealed || isSubmitting) return;

        // Mark as submitting to prevent double-votes
        setIsSubmitting(true);

        // Update UI immediately for better responsiveness
        setSelectedValue(value);

        // Process value for server
        let serverValue: number | null = null;
        if (value !== '?' && value !== 'Pass') {
            serverValue = Number(value);
        }

        // Use socketService method instead of socket.emit
        socketService.submitVote(serverValue);

        // Reset submitting state after a short delay
        setTimeout(() => setIsSubmitting(false), 300);
    };

    // Reveal votes (host only)
    const handleRevealVotes = () => {
        if (isHost) {
            socketService.revealVotes(true);
        }
    };

    // Reset votes (host only)
    const handleResetVotes = () => {
        if (isHost) {
            socketService.resetVotes();
        }
    };

    // Update issue (host only)
    const handleUpdateIssue = () => {
        if (isHost && issueInput.trim()) {
            socketService.updateIssue(issueInput.trim());
            setIssueInput('');
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
                            disabled={!issueInput.trim()}
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
                                disabled={isRevealed || votedCount === 0}
                                sx={{ mr: 1 }}
                            >
                                Reveal Votes
                            </Button>
                            <Button
                                variant="outlined"
                                startIcon={<RestartAltIcon />}
                                onClick={handleResetVotes}
                                disabled={!isRevealed && votedCount === 0}
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
                                ? (userVote.value === null ? 'Pass' : userVote.value)
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
                            // Select card if it matches the user's vote or the currently selected value
                            const isSelected = hasUserVoted
                                ? (userVote.value === null && value === 'Pass') || userVote.value === value
                                : selectedValue === value;

                            return (
                                <VotingCard
                                    key={value}
                                    value={value}
                                    selected={isSelected}
                                    onSelect={() => handleVote(value)}
                                    revealed={isRevealed}
                                    disabled={isSubmitting}
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