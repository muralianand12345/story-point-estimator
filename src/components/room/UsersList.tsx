import React from 'react';
import {
    Box,
    Typography,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    Avatar,
    Paper,
    IconButton,
    Tooltip,
    Badge,
    Divider,
    useTheme
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import StarIcon from '@mui/icons-material/Star';
import { User } from '../../types/room';

interface UsersListProps {
    users: User[];
    currentUserId: string;
    isHost: boolean;
    votesRevealed: boolean;
    onKickUser: (userId: string) => void;
}

const UsersList = ({
    users,
    currentUserId,
    isHost,
    votesRevealed,
    onKickUser
}: UsersListProps) => {
    const theme = useTheme();

    return (
        <Paper
            elevation={2}
            sx={{
                borderRadius: 2,
                height: '100%',
                display: 'flex',
                flexDirection: 'column'
            }}
        >
            <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
                <Typography variant="h6">
                    Participants ({users.length})
                </Typography>
            </Box>

            <List sx={{ overflowY: 'auto', flexGrow: 1 }}>
                {users.map((user) => (
                    <React.Fragment key={user.id}>
                        <ListItem
                            secondaryAction={
                                isHost && user.id !== currentUserId ? (
                                    <Tooltip title="Remove user">
                                        <IconButton
                                            edge="end"
                                            color="error"
                                            size="small"
                                            onClick={() => onKickUser(user.id)}
                                        >
                                            <PersonRemoveIcon />
                                        </IconButton>
                                    </Tooltip>
                                ) : null
                            }
                        >
                            <ListItemAvatar>
                                <Badge
                                    overlap="circular"
                                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                    badgeContent={
                                        user.isHost ? (
                                            <Tooltip title="Host">
                                                <StarIcon sx={{ fontSize: 16, color: theme.palette.warning.main }} />
                                            </Tooltip>
                                        ) : null
                                    }
                                >
                                    <Avatar
                                        alt={user.name}
                                        sx={{
                                            bgcolor: user.id === currentUserId ? theme.palette.primary.main : theme.palette.grey[500],
                                        }}
                                    >
                                        <PersonIcon />
                                    </Avatar>
                                </Badge>
                            </ListItemAvatar>

                            <ListItemText
                                primary={`${user.name}${user.id === currentUserId ? ' (You)' : ''}`}
                                secondary={
                                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                                        {user.vote !== null ? (
                                            <>
                                                <CheckCircleIcon
                                                    sx={{
                                                        fontSize: 16,
                                                        color: theme.palette.success.main,
                                                        mr: 0.5
                                                    }}
                                                />
                                                {votesRevealed ? (
                                                    <Typography variant="body2">
                                                        Voted: {user.vote}
                                                    </Typography>
                                                ) : (
                                                    <Typography variant="body2">
                                                        Voted
                                                    </Typography>
                                                )}
                                            </>
                                        ) : (
                                            <>
                                                <HourglassEmptyIcon
                                                    sx={{
                                                        fontSize: 16,
                                                        color: theme.palette.text.secondary,
                                                        mr: 0.5
                                                    }}
                                                />
                                                <Typography variant="body2">
                                                    Not voted yet
                                                </Typography>
                                            </>
                                        )}
                                    </Box>
                                }
                            />
                        </ListItem>
                        <Divider variant="inset" component="li" />
                    </React.Fragment>
                ))}
            </List>
        </Paper>
    );
};

export default UsersList;