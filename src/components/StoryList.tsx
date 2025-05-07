"use client"

import React, { useState } from "react";
import { Story } from "@/lib/types";
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import ListItemButton from '@mui/material/ListItemButton';
import { styled } from '@mui/material/styles';

interface StoryListProps {
    stories: Story[];
    currentStoryId?: string;
    onStorySelect: (storyId: string) => void;
    onCreateStory: (title: string, description: string) => void;
    isAdmin: boolean;
}

const StoryListItem = styled(ListItemButton, {
    shouldForwardProp: (prop) => prop !== 'isSelected'
})<{ isSelected?: boolean }>(({ theme, isSelected }) => ({
    borderRadius: theme.shape.borderRadius,
    marginBottom: theme.spacing(1.5),
    borderLeft: isSelected ? `4px solid ${theme.palette.primary.main}` : '4px solid transparent',
    backgroundColor: isSelected ? theme.palette.primary.light : 'transparent',
    '&:hover': {
        backgroundColor: isSelected ? theme.palette.primary.light : theme.palette.action.hover,
    },
    padding: theme.spacing(2),
}));

const EmptyStoriesBox = styled(Box)(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing(5),
    textAlign: 'center',
}));

const StoryList: React.FC<StoryListProps> = ({
    stories,
    currentStoryId,
    onStorySelect,
    onCreateStory,
    isAdmin
}) => {
    const [showNewStoryForm, setShowNewStoryForm] = useState(false);
    const [newStoryTitle, setNewStoryTitle] = useState("");
    const [newStoryDescription, setNewStoryDescription] = useState("");

    const handleCreateStory = (e: React.FormEvent) => {
        e.preventDefault();
        if (newStoryTitle.trim()) {
            onCreateStory(newStoryTitle.trim(), newStoryDescription.trim());
            setNewStoryTitle("");
            setNewStoryDescription("");
            setShowNewStoryForm(false);
        }
    };

    const activeStories = stories.filter((story) => story.isActive);
    const completedStories = stories.filter((story) => !story.isActive);

    return (
        <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold' }}>
                    Stories
                </Typography>
                {isAdmin && (
                    <Button
                        color="primary"
                        startIcon={showNewStoryForm ? <CloseIcon /> : <AddIcon />}
                        onClick={() => setShowNewStoryForm(!showNewStoryForm)}
                        variant="text"
                    >
                        {showNewStoryForm ? "Cancel" : "Add Story"}
                    </Button>
                )}
            </Box>

            {showNewStoryForm && (
                <Box
                    component="form"
                    onSubmit={handleCreateStory}
                    sx={{
                        mb: 3,
                        p: 2.5,
                        bgcolor: 'action.hover',
                        borderRadius: 2,
                    }}
                >
                    <TextField
                        fullWidth
                        label="Title"
                        id="storyTitle"
                        value={newStoryTitle}
                        onChange={(e) => setNewStoryTitle(e.target.value)}
                        placeholder="Enter story title"
                        required
                        margin="normal"
                    />
                    <TextField
                        fullWidth
                        label="Description (optional)"
                        id="storyDescription"
                        value={newStoryDescription}
                        onChange={(e) => setNewStoryDescription(e.target.value)}
                        placeholder="Enter story description"
                        multiline
                        rows={3}
                        margin="normal"
                    />
                    <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        sx={{ mt: 2 }}
                    >
                        Create Story
                    </Button>
                </Box>
            )}

            {activeStories.length === 0 && completedStories.length === 0 && !showNewStoryForm && (
                <EmptyStoriesBox>
                    <Box
                        sx={{
                            width: 64,
                            height: 64,
                            borderRadius: '50%',
                            bgcolor: 'action.hover',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mb: 2
                        }}
                    >
                        <AddIcon color="action" fontSize="large" />
                    </Box>
                    <Typography color="textSecondary">
                        No stories yet. {isAdmin ? "Add a story to get started." : "Waiting for admin to add stories."}
                    </Typography>
                </EmptyStoriesBox>
            )}

            {activeStories.length > 0 && (
                <Box sx={{ mb: 3 }}>
                    <Typography
                        variant="subtitle1"
                        sx={{
                            fontWeight: 600,
                            color: 'primary.main',
                            mb: 1.5,
                            pb: 1,
                            borderBottom: 1,
                            borderColor: 'divider'
                        }}
                    >
                        Active Stories
                    </Typography>
                    <List disablePadding>
                        {activeStories.map((story) => (
                            <StoryListItem
                                key={story.id}
                                isSelected={currentStoryId === story.id}
                                onClick={() => onStorySelect(story.id)}
                            >
                                <ListItemText
                                    primary={<Typography fontWeight="medium">{story.title}</Typography>}
                                    secondary={
                                        story.description && (
                                            <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                                                {story.description}
                                            </Typography>
                                        )
                                    }
                                />
                                {story.isRevealed && (
                                    <Chip
                                        label="Revealed"
                                        color="success"
                                        size="small"
                                        sx={{ ml: 1 }}
                                    />
                                )}
                            </StoryListItem>
                        ))}
                    </List>
                </Box>
            )}

            {completedStories.length > 0 && (
                <Box>
                    <Typography
                        variant="subtitle1"
                        sx={{
                            fontWeight: 600,
                            color: 'text.secondary',
                            mb: 1.5,
                            pb: 1,
                            borderBottom: 1,
                            borderColor: 'divider'
                        }}
                    >
                        Completed Stories
                    </Typography>
                    <List disablePadding>
                        {completedStories.map((story) => (
                            <ListItem
                                key={story.id}
                                sx={{
                                    bgcolor: 'action.hover',
                                    borderRadius: 2,
                                    opacity: 0.8,
                                    mb: 1.5,
                                    p: 2
                                }}
                            >
                                <ListItemText
                                    primary={<Typography fontWeight="medium">{story.title}</Typography>}
                                    secondary={
                                        story.description && (
                                            <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                                                {story.description}
                                            </Typography>
                                        )
                                    }
                                />
                                <Chip
                                    label="Completed"
                                    color="default"
                                    size="small"
                                />
                            </ListItem>
                        ))}
                    </List>
                </Box>
            )}
        </Paper>
    );
};

export default StoryList;