import React, { useState } from 'react';
import {
    Box,
    Paper,
    Typography,
    TextField,
    Button,
    Grid,
    Card,
    CardContent,
    Chip,
    useTheme
} from '@mui/material';
import LocalCafeIcon from '@mui/icons-material/LocalCafe';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { VoteValue } from '../../types/room';

interface VotingAreaProps {
    issueName: string;
    onIssueNameChange?: (name: string) => void;
    isHost: boolean;
    votesRevealed: boolean;
    selectedVote: VoteValue | null;
    onVote: (vote: VoteValue) => void;
    onRevealVotes: () => void;
    onResetVotes: () => void;
    votingEnabled: boolean;
    allVoted: boolean;
}

const VOTE_OPTIONS: VoteValue[] = ['1', '2', '3', '5', '8', '13', '21', '?', 'coffee'];

const VotingArea = ({
    issueName,
    onIssueNameChange,
    isHost,
    votesRevealed,
    selectedVote,
    onVote,
    onRevealVotes,
    onResetVotes,
    votingEnabled,
    allVoted
}: VotingAreaProps) => {
    const theme = useTheme();
    const [issueNameInput, setIssueNameInput] = useState(issueName);

    const handleIssueNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setIssueNameInput(e.target.value);
    };

    const handleIssueNameSubmit = () => {
        if (onIssueNameChange) {
            onIssueNameChange(issueNameInput);
        }
    };

    const renderVoteButton = (vote: VoteValue) => {
        const isSelected = selectedVote === vote;

        return (
            <Grid item xs={4} sm={4} md={4} key={vote}>
                <Card
                    raised={isSelected}
                    sx={{
                        cursor: 'pointer',
                        height: '100%',
                        transition: 'all 0.2s ease',
                        transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                        backgroundColor: isSelected ? theme.palette.primary.main : theme.palette.background.paper,
                        '&:hover': {
                            transform: 'scale(1.05)',
                            backgroundColor: isSelected
                                ? theme.palette.primary.main
                                : theme.palette.action.hover,
                        },
                    }}
                    onClick={() => onVote(vote)}
                >
                    <CardContent sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexDirection: 'column',
                        height: '100%',
                        p: 3
                    }}>
                        {vote === 'coffee' ? (
                            <LocalCafeIcon sx={{
                                fontSize: 48,
                                color: isSelected ? '#fff' : theme.palette.text.primary
                            }} />
                        ) : vote === '?' ? (
                            <HelpOutlineIcon sx={{
                                fontSize: 48,
                                color: isSelected ? '#fff' : theme.palette.text.primary
                            }} />
                        ) : (
                            <Typography
                                variant="h2"
                                component="div"
                                sx={{
                                    fontWeight: 'bold',
                                    color: isSelected ? '#fff' : theme.palette.text.primary
                                }}
                            >
                                {vote}
                            </Typography>
                        )}
                    </CardContent>
                </Card>
            </Grid>
        );
    };

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Paper
                elevation={2}
                sx={{
                    p: 3,
                    mb: 3,
                    borderRadius: 2,
                }}
            >
                <Typography variant="h6" gutterBottom>
                    Current Story/Task
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                    <TextField
                        fullWidth
                        label="Issue Name"
                        variant="outlined"
                        value={issueNameInput}
                        onChange={handleIssueNameChange}
                        disabled={!isHost}
                        sx={{ flexGrow: 1 }}
                    />

                    {isHost && (
                        <Button
                            variant="contained"
                            onClick={handleIssueNameSubmit}
                            sx={{ mt: 1 }}
                        >
                            Update
                        </Button>
                    )}
                </Box>

                {!isHost && issueName && (
                    <Typography
                        variant="body1"
                        sx={{
                            mt: 2,
                            fontWeight: 'medium',
                            display: 'flex',
                            alignItems: 'center'
                        }}
                    >
                        <Chip
                            label="Current Issue"
                            size="small"
                            color="primary"
                            sx={{ mr: 1 }}
                        />
                        {issueName}
                    </Typography>
                )}
            </Paper>

            <Paper
                elevation={2}
                sx={{
                    p: 3,
                    borderRadius: 2,
                    flexGrow: 1,
                    display: 'flex',
                    flexDirection: 'column'
                }}
            >
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        mb: 3
                    }}
                >
                    <Typography variant="h6">
                        Choose Your Estimate
                    </Typography>

                    {isHost && (
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <Button
                                variant="outlined"
                                color="secondary"
                                onClick={onResetVotes}
                                disabled={!votesRevealed}
                            >
                                Reset Votes
                            </Button>

                            <Button
                                variant="contained"
                                color="primary"
                                onClick={onRevealVotes}
                                disabled={votesRevealed || !allVoted}
                            >
                                Reveal Votes
                            </Button>
                        </Box>
                    )}
                </Box>

                {votesRevealed && !isHost && (
                    <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 2 }}
                    >
                        Votes have been revealed. Please wait for the host to start the next round.
                    </Typography>
                )}

                {!votingEnabled && (
                    <Typography
                        variant="body2"
                        color="error"
                        sx={{ mb: 2 }}
                    >
                        Voting is currently disabled.
                    </Typography>
                )}

                <Box sx={{ flexGrow: 1 }}>
                    <Grid container spacing={2}>
                        {VOTE_OPTIONS.map(renderVoteButton)}
                    </Grid>
                </Box>

                {selectedVote && !votesRevealed && (
                    <Box sx={{ mt: 3, textAlign: 'center' }}>
                        <Chip
                            label={`You voted: ${selectedVote}`}
                            color="success"
                            size="medium"
                            sx={{ px: 2, py: 1 }}
                        />
                        <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
                            You can change your vote until the host reveals all votes
                        </Typography>
                    </Box>
                )}

                {!selectedVote && !votesRevealed && (
                    <Box sx={{ mt: 3, textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                            Select a card to cast your vote
                        </Typography>
                    </Box>
                )}
            </Paper>
        </Box>
    );
};

export default VotingArea;