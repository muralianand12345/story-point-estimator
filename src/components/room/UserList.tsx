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
    Tooltip
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

    return (
        <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
                Participants ({users.length})
            </Typography>
            <List sx={{ maxHeight: 'calc(100% - 40px)', overflow: 'auto' }}>
                {users.map((user) => {
                    const isUserHost = user.id === hostId;

                    return (
                        <ListItem
                            key={user.id}
                            secondaryAction={
                                isHost && !isUserHost ? (
                                    <Tooltip title="Kick user">
                                        <IconButton
                                            edge="end"
                                            aria-label="kick"
                                            onClick={() => onKickUser(user.id)}
                                        >
                                            <PersonRemoveIcon />
                                        </IconButton>
                                    </Tooltip>
                                ) : null
                            }
                        >
                            <ListItemAvatar>
                                <Avatar sx={{ bgcolor: isUserHost ? 'primary.main' : 'grey.500' }}>
                                    {isUserHost ? <StarIcon /> : <PersonIcon />}
                                </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                                primary={`${user.name}${user.id === currentUserId ? ' (You)' : ''}`}
                                secondary={isUserHost ? 'Host' : ''}
                            />
                        </ListItem>
                    );
                })}
            </List>
        </Paper>
    );
};

export default UserList;