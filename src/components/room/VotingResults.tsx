import React, { useMemo } from 'react';
import {
    Box,
    Typography,
    Paper,
    Divider,
    Grid,
    Chip,
    Tooltip
} from '@mui/material';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import { User, Vote } from '@/types';

interface VotingResultsProps {
    votes: Record<string, Vote>;
    users: User[];
}

const VotingResults: React.FC<VotingResultsProps> = ({ votes, users }) => {
    // Calculate metrics
    const metrics = useMemo(() => {
        const voteValues = Object.values(votes)
            .map(v => v.value)
            .filter(v => v !== null) as number[];

        if (voteValues.length === 0) return { average: 0, median: 0, mode: [], total: 0 };

        // Calculate average
        const average = voteValues.reduce((sum, value) => sum + value, 0) / voteValues.length;

        // Calculate median
        const sorted = [...voteValues].sort((a, b) => a - b);
        const middle = Math.floor(sorted.length / 2);
        const median = sorted.length % 2 === 0
            ? (sorted[middle - 1] + sorted[middle]) / 2
            : sorted[middle];

        // Calculate mode (most common value)
        const frequency: Record<number, number> = {};
        voteValues.forEach(value => {
            frequency[value] = (frequency[value] || 0) + 1;
        });

        let maxFrequency = 0;
        let modes: number[] = [];

        for (const [value, count] of Object.entries(frequency)) {
            if (count > maxFrequency) {
                maxFrequency = count;
                modes = [Number(value)];
            } else if (count === maxFrequency) {
                modes.push(Number(value));
            }
        }

        return {
            average: parseFloat(average.toFixed(1)),
            median,
            mode: modes,
            total: voteValues.length
        };
    }, [votes]);

    // Prepare data for charts
    const chartData = useMemo(() => {
        const data: Record<string | number, number> = {};

        Object.values(votes).forEach(vote => {
            if (vote.value !== null) {
                const value = vote.value;
                data[value] = (data[value] || 0) + 1;
            }
        });

        // Convert to array format for recharts
        return Object.entries(data).map(([value, count]) => ({
            value: value === 'null' ? 'Pass' : value,
            count
        }));
    }, [votes]);

    // Colors for pie chart
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

    // Format individual votes by user
    const userVotes = useMemo(() => {
        return users.map(user => {
            const userVote = votes[user.id];
            const voteValue = userVote?.value;

            return {
                user,
                vote: voteValue === null ? 'Pass' : voteValue === undefined ? null : voteValue
            };
        });
    }, [users, votes]);

    return (
        <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
            <Paper elevation={2} sx={{ p: 3, mb: 3, bgcolor: 'background.paper' }}>
                <Typography variant="h6" gutterBottom>
                    Voting Results
                </Typography>

                <Grid container spacing={3} sx={{ mb: 3 }}>
                    <Grid item xs={6} sm={3}>
                        <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="body2" color="text.secondary">
                                Average
                            </Typography>
                            <Typography variant="h4">{metrics.average}</Typography>
                        </Box>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                        <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="body2" color="text.secondary">
                                Median
                            </Typography>
                            <Typography variant="h4">{metrics.median}</Typography>
                        </Box>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                        <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="body2" color="text.secondary">
                                Mode
                            </Typography>
                            <Typography variant="h4">
                                {metrics.mode.length > 0 ? metrics.mode.join(', ') : 'N/A'}
                            </Typography>
                        </Box>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                        <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="body2" color="text.secondary">
                                Total Votes
                            </Typography>
                            <Typography variant="h4">{metrics.total}</Typography>
                        </Box>
                    </Grid>
                </Grid>

                <Divider sx={{ my: 3 }} />

                <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                        <Typography variant="subtitle1" gutterBottom>
                            Vote Distribution
                        </Typography>
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie
                                    data={chartData}
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="count"
                                    nameKey="value"
                                    label={({ value, name }) => `${name}: ${value}`}
                                >
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <RechartsTooltip formatter={(value, name, props) => [`${value} votes`, `Value: ${props.payload.value}`]} />
                            </PieChart>
                        </ResponsiveContainer>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Typography variant="subtitle1" gutterBottom>
                            Vote Count by Value
                        </Typography>
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart
                                data={chartData}
                                margin={{
                                    top: 5,
                                    right: 30,
                                    left: 20,
                                    bottom: 5,
                                }}
                            >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="value" />
                                <YAxis />
                                <RechartsTooltip />
                                <Bar dataKey="count" fill="#8884d8" name="Votes" />
                            </BarChart>
                        </ResponsiveContainer>
                    </Grid>
                </Grid>

                <Divider sx={{ my: 3 }} />

                <Typography variant="subtitle1" gutterBottom>
                    Individual Votes
                </Typography>
                <Box sx={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 1,
                    mt: 2
                }}>
                    {userVotes.map(({ user, vote }) => (
                        <Tooltip key={user.id} title={user.name}>
                            <Chip
                                label={`${user.name}: ${vote === null ? '-' : vote}`}
                                color={vote === null ? 'default' : 'primary'}
                                variant={vote === null ? 'outlined' : 'filled'}
                            />
                        </Tooltip>
                    ))}
                </Box>
            </Paper>
        </Box>
    );
};

export default VotingResults;