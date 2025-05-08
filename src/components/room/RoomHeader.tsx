import React from 'react';
import {
    Box,
    Typography,
    Button,
    Paper,
    Divider,
    Chip,
    Tooltip
} from '@mui/material';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import InviteLink from './InviteLink';
import ThemeToggle from '@/components/ui/ThemeToggle';

interface RoomHeaderProps {
    roomName: string;
    roomCode: string;
    inviteLink: string;
    onLeaveRoom: () => void;
}

const RoomHeader: React.FC<RoomHeaderProps> = ({
    roomName,
    roomCode,
    inviteLink,
    onLeaveRoom,
}) => {
    return (
        <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="h4" component="h1">
                        {roomName}
                    </Typography>
                    <Tooltip title="Room Code" placement="top">
                        <Chip
                            label={roomCode}
                            color="primary"
                            variant="outlined"
                            size="medium"
                        />
                    </Tooltip>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <ThemeToggle />
                    <Button
                        variant="outlined"
                        color="error"
                        startIcon={<ExitToAppIcon />}
                        onClick={onLeaveRoom}
                    >
                        Leave Room
                    </Button>
                </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Typography variant="body2" color="text.secondary" gutterBottom>
                Share this link to invite others:
            </Typography>
            <InviteLink inviteLink={inviteLink} />
        </Paper>
    );
};

export default RoomHeader;