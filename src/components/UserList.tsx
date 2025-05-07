import React from "react";
import { RoomUser, Vote } from "@/lib/types";
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';
import { styled } from '@mui/material/styles';

interface UserListProps {
    users: RoomUser[];
    votes: Vote[];
    currentStoryId?: string;
    isRevealed: boolean;
}

const UserAvatar = styled(Avatar)(({ theme }) => ({
    background: `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.main} 100%)`,
    color: theme.palette.primary.contrastText,
    fontWeight: 'bold',
    marginRight: theme.spacing(1.5),
    boxShadow: theme.shadows[1]
}));

const UserListItem = styled(ListItem)(({ theme }) => ({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing(1.5),
    borderRadius: theme.shape.borderRadius,
    '&:hover': {
        backgroundColor: theme.palette.action.hover,
    },
    marginBottom: theme.spacing(1),
}));

const UserList: React.FC<UserListProps> = ({ users, votes, currentStoryId, isRevealed }) => {
    return (
        <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold', mb: 2 }}>
                Participants ({users.length})
            </Typography>

            <List disablePadding>
                {users.map((roomUser) => {
                    const hasVoted = currentStoryId
                        ? votes.some((vote) => vote.userId === roomUser.userId && vote.storyId === currentStoryId)
                        : false;

                    const userVote = votes.find((vote) => vote.userId === roomUser.userId && vote.storyId === currentStoryId);

                    return (
                        <UserListItem key={roomUser.userId}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <UserAvatar>
                                    {roomUser.user.name.charAt(0).toUpperCase()}
                                </UserAvatar>
                                <ListItemText
                                    primary={
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <Typography fontWeight="medium">{roomUser.user.name}</Typography>
                                            {roomUser.isAdmin && (
                                                <Chip
                                                    label="Admin"
                                                    size="small"
                                                    color="primary"
                                                    variant="outlined"
                                                    sx={{ ml: 1 }}
                                                />
                                            )}
                                        </Box>
                                    }
                                />
                            </Box>

                            {hasVoted ? (
                                isRevealed ? (
                                    <Chip
                                        label={userVote?.value}
                                        color="success"
                                    />
                                ) : (
                                    <Chip
                                        label="Voted"
                                        color="success"
                                    />
                                )
                            ) : (
                                <Chip
                                    label="Not voted"
                                    color="default"
                                    variant="outlined"
                                />
                            )}
                        </UserListItem>
                    );
                })}
            </List>
        </Paper>
    );
};

export default UserList;