'use client';

import React, { useMemo, useEffect, useState } from 'react';
import {
    Box,
    Typography,
    Paper,
    Divider,
    Grid,
    Chip,
    Tooltip,
    CircularProgress,
    Alert
} from '@mui/material';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import { User, Vote } from '@/types';

interface VotingResultsProps {
    votes: Record<string, Vote>;
    users: User[];
}

const VotingResults: React.FC<VotingResultsProps> = ({ votes, users }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Set initial loading state
    useEffect(() => {
        if (Object.keys(votes).length === 0) {
            setIsLoading(true);
            setError(null);
        } else {
            // Small delay to allow animation
            const timer = setTimeout(() => {
                setIsLoading(false);
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [votes]);

    // Calculate metrics
    const metrics = useMemo(() => {
        try {
            const voteValues = Object.values(votes)
                .map(v => v.value)
                .filter(v => v !== null && v !== -1) as number[]; // Filter out null and ? (-1) votes

            if (voteValues.length === 0) return { average: 0, median: 0, mode: [], total: 0 };

            // Calculate average (mean)
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
                total: Object.keys(votes).length // Count all votes, including Pass and ?
            };
        } catch (error) {
            console.error("Error calculating vote metrics:", error);
            setError("Failed to calculate vote statistics");
            return { average: 0, median: 0, mode: [], total: 0 };
        }
    }, [votes]);

    // Prepare data for charts
    const chartData = useMemo(() => {
        try {
            const data: Record<string | number, number> = {};

            Object.values(votes).forEach(vote => {
                const value = vote.value === null ? 'Pass' : vote.value === -1 ? '?' : vote.value;
                const valueKey = String(value); // Convert to string for consistency as object key
                data[valueKey] = (data[valueKey] || 0) + 1;
            });

            // Convert to array format for recharts
            return Object.entries(data).map(([value, count]) => ({
                value,
                count
            }));
        } catch (error) {
            console.error("Error preparing chart data:", error);
            setError("Failed to prepare chart data");
            return [];
        }
    }, [votes]);

    // Colors for pie chart
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

    // Format individual votes by user
    const userVotes = useMemo(() => {
        try {
            return users.map(user => {
                const userVote = votes[user.id];
                let voteDisplay;

                if (!userVote) {
                    voteDisplay = null; // Not voted
                } else if (userVote.value === null) {
                    voteDisplay = 'Pass';
                } else if (userVote.value === -1) {
                    voteDisplay = '?';
                } else {
                    voteDisplay = userVote.value;
                }

                return {
                    user,
                    vote: voteDisplay
                };
            });
        } catch (error) {
            console.error("Error formatting user votes:", error);
            setError("Failed to format user votes");
            return [];
        }
    }, [users, votes]);

    // If there's an error, show error message
    if (error) {
        return (
            <Alert severity="error" sx={{ mb: 2 }}>
                {error}
            </Alert>
        );
    }

    // Show loading state
    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
                <CircularProgress />
            </Box>
        );
    }

    // Empty state - no votes yet
    if (metrics.total === 0) {
        return (
            <Box sx={{ textAlign: 'center', p: 4 }}>
                <Typography variant="h6" color="text.secondary">
                    No votes to display.
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Votes will appear here once they are submitted.
                </Typography>
            </Box>
        );
    }

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

                {chartData.length > 0 ? (
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                            <Typography variant="subtitle1" gutterBottom>
                                Vote Distribution
                            </Typography>
                            <Box sx={{ height: 250, width: '100%' }}>
                                <ResponsiveContainer width="100%" height="100%">
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
                            </Box>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Typography variant="subtitle1" gutterBottom>
                                Vote Count by Value
                            </Typography>
                            <Box sx={{ height: 250, width: '100%' }}>
                                <ResponsiveContainer width="100%" height="100%">
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
                                        <RechartsTooltip cursor={{ fill: 'rgba(0, 0, 0, 0.1)' }} />
                                        <Bar dataKey="count" fill="#8884d8" name="Votes" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </Box>
                        </Grid>
                    </Grid>
                ) : (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Typography variant="body1" color="text.secondary">
                            Not enough data to generate charts
                        </Typography>
                    </Box>
                )}

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
                                color={vote === null ? 'default' : user.id === user.id ? 'primary' : 'success'}
                                variant={vote === null ? 'outlined' : 'filled'}
                                sx={{
                                    fontWeight: user.id === user.id ? 'bold' : 'normal',
                                    animation: vote !== null ? 'pulse 1s' : 'none',
                                    '@keyframes pulse': {
                                        '0%': { boxShadow: '0 0 0 0 rgba(0,0,0, 0.2)' },
                                        '70%': { boxShadow: '0 0 0 6px rgba(0,0,0, 0)' },
                                        '100%': { boxShadow: '0 0 0 0 rgba(0,0,0, 0)' },
                                    }
                                }}
                            />
                        </Tooltip>
                    ))}
                </Box>
            </Paper>
        </Box>
    );
};

export default VotingResults;