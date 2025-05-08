import React from 'react';
import {
    Box,
    Typography,
    Button,
    Paper,
    Divider
} from '@mui/material';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import InviteLink from './InviteLink';

interface RoomHeaderProps {
    roomName: string;
    inviteLink: string;
    onLeaveRoom: () => void;
}

const RoomHeader: React.FC<RoomHeaderProps> = ({
    roomName,
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
                <Typography variant="h4" component="h1">
                    {roomName}
                </Typography>
                <Button
                    variant="outlined"
                    color="error"
                    startIcon={<ExitToAppIcon />}
                    onClick={onLeaveRoom}
                >
                    Leave Room
                </Button>
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