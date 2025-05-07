"use client"

import React from "react";
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import { styled } from '@mui/material/styles';

interface EstimationCardProps {
    value: string;
    selected: boolean;
    onClick: () => void;
    revealed: boolean;
    count?: number;
}

const StyledCard = styled(Paper, {
    shouldForwardProp: (prop) => prop !== 'selected' && prop !== 'revealed'
})<{ selected: boolean; revealed: boolean }>(({ theme, selected, revealed }) => ({
    width: 80,
    height: 112,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    border: selected ? `2px solid ${theme.palette.primary.main}` : `2px solid ${theme.palette.divider}`,
    backgroundColor: selected ? theme.palette.primary.light : theme.palette.background.paper,
    transform: selected ? 'scale(1.1)' : 'scale(1)',
    '&:hover': {
        borderColor: theme.palette.primary.light,
        backgroundColor: !selected ? theme.palette.action.hover : theme.palette.primary.light,
    },
}));

const EstimationCard: React.FC<EstimationCardProps> = ({
    value,
    selected,
    onClick,
    revealed,
    count
}) => {
    return (
        <StyledCard
            selected={selected}
            revealed={revealed}
            onClick={onClick}
            elevation={selected ? 3 : 1}
        >
            <Typography
                variant="h4"
                component="div"
                sx={{
                    fontWeight: 'bold',
                    color: selected ? 'primary.main' : 'text.primary'
                }}
            >
                {value}
            </Typography>

            {revealed && count !== undefined && (
                <Chip
                    label={`${count} ${count === 1 ? 'vote' : 'votes'}`}
                    size="small"
                    color={count > 0 ? 'success' : 'default'}
                    sx={{ mt: 1 }}
                />
            )}
        </StyledCard>
    );
};

export default EstimationCard;