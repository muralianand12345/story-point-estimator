'use client';

import React from 'react';
import { Box, Paper, Typography } from '@mui/material';

interface VotingCardProps {
    value: number | string;
    selected: boolean;
    onSelect: () => void;
    revealed: boolean;
    disabled: boolean;
}

const VotingCard: React.FC<VotingCardProps> = ({
    value,
    selected,
    onSelect,
    revealed,
    disabled
}) => {
    // Handle card click with logging
    const handleClick = () => {
        console.log(`Card clicked: ${value}, disabled: ${disabled}`);
        if (!disabled) {
            console.log(`Selecting value: ${value}`);
            onSelect();
        }
    };

    // Determine the color based on the card value
    const getCardColor = () => {
        // Use red for face cards, black for numbers
        if (value === '?' || value === 'Pass') {
            return '#6A5ACD'; // SlateBlue for special cards
        } else if ([0, 0.5, 1, 2, 3, 5, 8, 13, 20, 40, 100].includes(Number(value))) {
            return '#000000'; // Black for number cards
        } else {
            return '#B22222'; // FireBrick red for other values
        }
    };

    const color = getCardColor();

    return (
        <Paper
            elevation={selected ? 8 : 2}
            sx={{
                width: '100px',
                height: '140px',
                margin: '8px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '10px',
                cursor: disabled ? 'default' : 'pointer',
                borderRadius: '10px',
                transform: selected ? 'translateY(-10px)' : 'none',
                transition: 'all 0.2s ease',
                position: 'relative',
                backgroundColor: selected ? '#e3f2fd' : '#ffffff',
                border: selected ? '2px solid #2196f3' : '1px solid #ccc',
                opacity: disabled && !selected ? 0.7 : 1,
                '&:hover': {
                    backgroundColor: disabled ? (selected ? '#e3f2fd' : '#ffffff') : '#f5f5f5',
                    transform: disabled ? (selected ? 'translateY(-10px)' : 'none') : 'translateY(-5px)'
                }
            }}
            onClick={handleClick}
        >
            {/* Top left value */}
            <Typography
                variant="h6"
                sx={{
                    fontWeight: 'bold',
                    color: color,
                    alignSelf: 'flex-start',
                }}
            >
                {value}
            </Typography>

            {/* Center value (larger) */}
            <Typography
                variant="h4"
                sx={{
                    fontWeight: 'bold',
                    color: color,
                    alignSelf: 'center',
                }}
            >
                {value}
            </Typography>

            {/* Bottom right value (upside down) */}
            <Typography
                variant="h6"
                sx={{
                    fontWeight: 'bold',
                    color: color,
                    alignSelf: 'flex-end',
                    transform: 'rotate(180deg)',
                }}
            >
                {value}
            </Typography>

            {/* Highlight for selected card */}
            {selected && (
                <Box
                    sx={{
                        position: 'absolute',
                        bottom: '-10px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: '80%',
                        height: '5px',
                        bgcolor: 'primary.main',
                        borderRadius: '5px',
                    }}
                />
            )}

            {/* Reflection effect for playing card feel */}
            <Box
                sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '40%',
                    background: 'linear-gradient(to bottom, rgba(255,255,255,0.3), rgba(255,255,255,0))',
                    borderTopLeftRadius: '10px',
                    borderTopRightRadius: '10px',
                    pointerEvents: 'none',
                }}
            />
        </Paper>
    );
};

export default VotingCard;