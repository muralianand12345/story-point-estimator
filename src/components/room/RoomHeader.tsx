'use client';

import React, { useState } from 'react';
import {
    Box,
    Typography,
    Button,
    Paper,
    Divider,
    Chip,
    IconButton,
    Tooltip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Grid,
    Snackbar,
    Alert
} from '@mui/material';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import CloseIcon from '@mui/icons-material/Close';
import ShareIcon from '@mui/icons-material/Share';
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
    const [dialogOpen, setDialogOpen] = useState<boolean>(false);
    const [copySuccess, setCopySuccess] = useState<string | null>(null);

    const handleOpenDialog = () => {
        setDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(inviteLink);
        setCopySuccess('Invite link copied to clipboard!');
    };

    const handleCopyCode = () => {
        navigator.clipboard.writeText(roomCode);
        setCopySuccess('Room code copied to clipboard!');
    };

    const handleSnackbarClose = () => {
        setCopySuccess(null);
    };

    return (
        <>
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
                                size="medium"
                                onClick={handleCopyCode}
                                icon={<ContentCopyIcon fontSize="small" />}
                            />
                        </Tooltip>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Button
                            variant="contained"
                            color="primary"
                            startIcon={<PersonAddIcon />}
                            onClick={handleOpenDialog}
                        >
                            Invite
                        </Button>
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
            </Paper>

            {/* Invite Dialog */}
            <Dialog
                open={dialogOpen}
                onClose={handleCloseDialog}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                        Invite People to Join
                        <IconButton onClick={handleCloseDialog} size="small">
                            <CloseIcon />
                        </IconButton>
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle1" gutterBottom>
                            Share this room code:
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Chip
                                label={roomCode}
                                color="primary"
                                size="medium"
                                sx={{
                                    fontSize: '1.5rem',
                                    height: '3rem',
                                    px: 2,
                                    mr: 2,
                                    letterSpacing: '0.2rem'
                                }}
                            />
                            <Button
                                variant="outlined"
                                startIcon={<ContentCopyIcon />}
                                onClick={handleCopyCode}
                            >
                                Copy Code
                            </Button>
                        </Box>
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    <Box>
                        <Typography variant="subtitle1" gutterBottom>
                            Or share this link:
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid item xs>
                                <TextField
                                    fullWidth
                                    size="small"
                                    value={inviteLink}
                                    InputProps={{
                                        readOnly: true,
                                    }}
                                />
                            </Grid>
                            <Grid item>
                                <Button
                                    variant="contained"
                                    startIcon={<ShareIcon />}
                                    onClick={handleCopyLink}
                                >
                                    Copy Link
                                </Button>
                            </Grid>
                        </Grid>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Close</Button>
                </DialogActions>
            </Dialog>

            {/* Success Snackbar */}
            <Snackbar
                open={!!copySuccess}
                autoHideDuration={3000}
                onClose={handleSnackbarClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    onClose={handleSnackbarClose}
                    severity="success"
                    variant="filled"
                    sx={{ width: '100%' }}
                >
                    {copySuccess}
                </Alert>
            </Snackbar>
        </>
    );
};

export default RoomHeader;