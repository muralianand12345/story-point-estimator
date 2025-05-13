'use client';

import React from 'react';
import {
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    Avatar,
    IconButton,
    Typography,
    Paper,
    Tooltip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import StarIcon from '@mui/icons-material/Star';
import { User } from '@/types';

interface UserListProps {
    users: User[];
    currentUserId: string;
    hostId: string;
    onKickUser: (userId: string) => void;
}

const UserList: React.FC<UserListProps> = ({
    users,
    currentUserId,
    hostId,
    onKickUser,
}) => {
    const isHost = currentUserId === hostId;
    const [confirmKickDialog, setConfirmKickDialog] = React.useState<{ open: boolean, userId: string, name: string }>({
        open: false,
        userId: '',
        name: ''
    });

    // Show kick confirmation dialog
    const handleKickClick = (userId: string, name: string) => {
        setConfirmKickDialog({
            open: true,
            userId,
            name
        });
    };

    // Close the dialog without kicking
    const handleCancelKick = () => {
        setConfirmKickDialog({
            open: false,
            userId: '',
            name: ''
        });
    };

    // Confirm kick and close the dialog
    const handleConfirmKick = () => {
        if (confirmKickDialog.userId) {
            onKickUser(confirmKickDialog.userId);
        }
        setConfirmKickDialog({
            open: false,
            userId: '',
            name: ''
        });
    };

    return (
        <>
            <Paper sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Typography variant="h6" gutterBottom>
                    Participants ({users.length})
                </Typography>
                <List sx={{ maxHeight: 'calc(100% - 40px)', overflow: 'auto', flexGrow: 1 }}>
                    {users.map((user) => {
                        const isUserHost = user.id === hostId;
                        const isSelf = user.id === currentUserId;

                        return (
                            <ListItem
                                key={user.id}
                                secondaryAction={
                                    isHost && !isUserHost && !isSelf ? (
                                        <Tooltip title="Kick user">
                                            <IconButton
                                                edge="end"
                                                aria-label="kick"
                                                onClick={() => handleKickClick(user.id, user.name)}
                                                color="error"
                                                size="small"
                                            >
                                                <PersonRemoveIcon />
                                            </IconButton>
                                        </Tooltip>
                                    ) : null
                                }
                                sx={{
                                    borderRadius: '8px',
                                    mb: 0.5,
                                    '&:hover': {
                                        bgcolor: 'rgba(0, 0, 0, 0.04)',
                                    }
                                }}
                            >
                                <ListItemAvatar>
                                    <Avatar sx={{
                                        bgcolor: isUserHost
                                            ? 'primary.main'
                                            : isSelf
                                                ? 'secondary.main'
                                                : 'grey.500'
                                    }}>
                                        {isUserHost ? <StarIcon /> : <PersonIcon />}
                                    </Avatar>
                                </ListItemAvatar>
                                <ListItemText
                                    primary={`${user.name}${user.id === currentUserId ? ' (You)' : ''}`}
                                    secondary={isUserHost ? 'Host' : ''}
                                    primaryTypographyProps={{
                                        fontWeight: user.id === currentUserId ? 'bold' : 'normal'
                                    }}
                                />
                            </ListItem>
                        );
                    })}
                </List>
            </Paper>

            {/* Kick confirmation dialog */}
            <Dialog
                open={confirmKickDialog.open}
                onClose={handleCancelKick}
                aria-labelledby="kick-dialog-title"
            >
                <DialogTitle id="kick-dialog-title">
                    Kick User?
                </DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to kick {confirmKickDialog.name} from the room?
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCancelKick} color="primary">
                        Cancel
                    </Button>
                    <Button onClick={handleConfirmKick} color="error" variant="contained">
                        Kick User
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default UserList;