"use client"

import React, { useState, useEffect } from "react";
import EstimationCard from "./EstimationCard";
import { Vote } from "@/lib/types";
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import VisibilityIcon from '@mui/icons-material/Visibility';
import RefreshIcon from '@mui/icons-material/Refresh';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { styled } from '@mui/material/styles';

interface VotingPanelProps {
    storyId: string;
    userId: string;
    roomId: string;
    isRevealed: boolean;
    votes: Vote[];
    onVote: (value: string) => void;
    onReveal: () => void;
    onReset: () => void;
    onNextStory: () => void;
    isAdmin: boolean;
}

// Common story point values
const STORY_POINTS = ["0", "½", "1", "2", "3", "5", "8", "13", "20", "40", "100", "?"];

const ResultsPaper = styled(Paper)(({ theme }) => ({
    background: `linear-gradient(to right, ${theme.palette.primary.light}20, ${theme.palette.success.light}50)`,
    padding: theme.spacing(2.5),
    borderRadius: theme.shape.borderRadius,
    boxShadow: theme.shadows[2],
}));

const VotingPanel: React.FC<VotingPanelProps> = ({
    storyId,
    userId,
    votes,
    isRevealed,
    onVote,
    onReveal,
    onReset,
    onNextStory,
    isAdmin,
}) => {
    const [selectedValue, setSelectedValue] = useState<string | null>(null);
    const [revealAnimation, setRevealAnimation] = useState(false);

    // Find the user's vote
    useEffect(() => {
        const userVote = votes.find((vote) => vote.userId === userId && vote.storyId === storyId);
        if (userVote) {
            setSelectedValue(userVote.value);
        } else {
            setSelectedValue(null);
        }
    }, [votes, userId, storyId]);

    // Animation for reveal
    useEffect(() => {
        if (isRevealed) {
            setRevealAnimation(true);
            const timer = setTimeout(() => {
                setRevealAnimation(false);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [isRevealed]);

    // Count votes for each value
    const getVoteCounts = () => {
        const counts: Record<string, number> = {};
        STORY_POINTS.forEach((point) => {
            counts[point] = 0;
        });

        votes.forEach((vote) => {
            if (counts[vote.value] !== undefined) {
                counts[vote.value]++;
            }
        });

        return counts;
    };

    const voteCounts = getVoteCounts();

    // Calculate average (excluding '?' and non-numeric values)
    const calculateAverage = () => {
        if (votes.length === 0) return 0;

        const numericVotes = votes.filter((vote) => {
            const value = vote.value === "½" ? 0.5 : Number.parseFloat(vote.value);
            return !isNaN(value);
        });

        if (numericVotes.length === 0) return 0;

        const sum = numericVotes.reduce((acc, vote) => {
            const value = vote.value === "½" ? 0.5 : Number.parseFloat(vote.value);
            return acc + value;
        }, 0);

        return sum / numericVotes.length;
    };

    const handleCardClick = (value: string) => {
        setSelectedValue(value);
        onVote(value);
    };

    return (
        <Box sx={{ mt: 3 }}>
            <Grid container spacing={2} sx={{
                animation: revealAnimation ? 'pulse 1s' : 'none',
                '@keyframes pulse': {
                    '0%': { opacity: 1 },
                    '50%': { opacity: 0.7 },
                    '100%': { opacity: 1 }
                }
            }}>
                {STORY_POINTS.map((value) => (
                    <Grid item xs={4} sm={3} md={2} key={value}>
                        <EstimationCard
                            value={value}
                            selected={selectedValue === value}
                            onClick={() => handleCardClick(value)}
                            revealed={isRevealed}
                            count={isRevealed ? voteCounts[value] : undefined}
                        />
                    </Grid>
                ))}
            </Grid>

            <Box
                sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', md: 'row' },
                    justifyContent: 'space-between',
                    alignItems: { xs: 'stretch', md: 'center' },
                    mt: 4,
                    gap: 2
                }}
            >
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    {!isRevealed && votes.length > 0 && isAdmin && (
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={onReveal}
                            startIcon={<VisibilityIcon />}
                        >
                            Reveal Votes
                        </Button>
                    )}

                    {isRevealed && isAdmin && (
                        <>
                            <Button
                                variant="outlined"
                                color="secondary"
                                onClick={onReset}
                                startIcon={<RefreshIcon />}
                            >
                                Reset Votes
                            </Button>
                            <Button
                                variant="contained"
                                color="success"
                                onClick={onNextStory}
                                startIcon={<ArrowForwardIcon />}
                            >
                                Next Story
                            </Button>
                        </>
                    )}
                </Box>

                {isRevealed && (
                    <ResultsPaper>
                        <Typography variant="h5" component="p" fontWeight="bold">
                            Average: {calculateAverage().toFixed(1)} points
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                            {votes.length} vote{votes.length !== 1 ? "s" : ""}
                        </Typography>
                    </ResultsPaper>
                )}
            </Box>
        </Box>
    );
};

export default VotingPanel;