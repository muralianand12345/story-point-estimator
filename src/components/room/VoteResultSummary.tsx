import React, { useMemo } from 'react';
import {
    Box,
    Paper,
    Typography,
    Divider,
    useTheme
} from '@mui/material';
import { User, VoteValue } from '../../types/room';

interface VoteResultSummaryProps {
    users: User[];
    votesRevealed: boolean;
}

const VoteResultSummary = ({ users, votesRevealed }: VoteResultSummaryProps) => {
    const theme = useTheme();

    const voteStats = useMemo(() => {
        if (!votesRevealed) return null;

        const votes = users
            .filter(u => u.vote !== null)
            .map(u => u.vote as VoteValue);

        const voteCounts: Record<string, number> = {};
        const numericVotes: number[] = [];

        votes.forEach(vote => {
            // Count all votes
            voteCounts[vote] = (voteCounts[vote] || 0) + 1;

            // Track numeric votes for average
            if (!isNaN(Number(vote))) {
                numericVotes.push(Number(vote));
            }
        });

        // Calculate average (only for numeric votes)
        const average = numericVotes.length > 0
            ? numericVotes.reduce((sum, v) => sum + v, 0) / numericVotes.length
            : 0;

        // Find the most common vote
        let mostCommonVote: string | null = null;
        let highestCount = 0;

        Object.entries(voteCounts).forEach(([vote, count]) => {
            if (count > highestCount) {
                mostCommonVote = vote;
                highestCount = count;
            }
        });

        const consensus = highestCount > 0
            ? (highestCount / votes.length) * 100
            : 0;

        return {
            voteCounts,
            average: average.toFixed(1),
            mostCommonVote,
            consensus: Math.round(consensus),
            totalVotes: votes.length,
            totalUsers: users.length
        };
    }, [users, votesRevealed]);

    if (!votesRevealed || !voteStats) return null;

    return (
        <Paper
            elevation={3}
            sx={{
                p: 3,
                borderRadius: 2,
                mb: 3,
                backgroundColor: theme.palette.background.paper,
            }}
        >
            <Typography variant="h6" gutterBottom>
                Vote Summary
            </Typography>

            <Divider sx={{ my: 1 }} />

            <Box sx={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                gap: 3,
                mt: 2
            }}>
                <Box>
                    <Typography variant="body2" color="text.secondary">
                        Average (numeric votes)
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                        {voteStats.average}
                    </Typography>
                </Box>

                <Box>
                    <Typography variant="body2" color="text.secondary">
                        Most Common Vote
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                        {voteStats.mostCommonVote || 'N/A'}
                    </Typography>
                </Box>

                <Box>
                    <Typography variant="body2" color="text.secondary">
                        Consensus
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                        {voteStats.consensus}%
                    </Typography>
                </Box>

                <Box>
                    <Typography variant="body2" color="text.secondary">
                        Participation
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                        {voteStats.totalVotes}/{voteStats.totalUsers}
                    </Typography>
                </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle2" gutterBottom>
                Vote Distribution
            </Typography>

            <Box sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 1,
                mt: 1
            }}>
                {Object.entries(voteStats.voteCounts).map(([vote, count]) => (
                    <Box
                        key={vote}
                        sx={{
                            p: 1,
                            borderRadius: 1,
                            backgroundColor: theme.palette.action.hover,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            minWidth: 60
                        }}
                    >
                        <Typography variant="h6">{vote}</Typography>
                        <Typography variant="body2">
                            {count} {count === 1 ? 'vote' : 'votes'}
                        </Typography>
                    </Box>
                ))}
            </Box>
        </Paper>
    );
};

export default VoteResultSummary;