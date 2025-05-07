"use client"

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { socketClient } from "@/lib/socket";
import { MessageType, RoomUser, Story, Vote, Room } from "@/lib/types";
import UserList from "@/components/UserList";
import StoryList from "@/components/StoryList";
import VotingPanel from "@/components/VotingPanel";
import { ThemeToggle } from "@/components/theme-toggle";
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import IconButton from '@mui/material/IconButton';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';

const RoomPage: React.FC = () => {
    const params = useParams();
    const router = useRouter();
    const roomId = params.id as string;

    const [userId, setUserId] = useState<string>("");
    const [userName, setUserName] = useState<string>("");
    const [room, setRoom] = useState<Room | null>(null);
    const [stories, setStories] = useState<Story[]>([]);
    const [users, setUsers] = useState<RoomUser[]>([]);
    const [votes, setVotes] = useState<Vote[]>([]);
    const [currentStory, setCurrentStory] = useState<Story | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    // Initialize connection and data
    useEffect(() => {
        // Check if user ID exists in localStorage
        const storedUserId = localStorage.getItem("userId");
        const storedUserName = localStorage.getItem("userName");

        if (!storedUserId || !storedUserName) {
            // Redirect to join page if no user data
            router.push("/room/join");
            return;
        }

        setUserId(storedUserId);
        setUserName(storedUserName);

        // Connect to WebSocket
        const connect = async () => {
            try {
                if (!socketClient) {
                    throw new Error("WebSocket client not available");
                }

                await socketClient.connect();
                setIsConnected(true);

                // Join room
                socketClient.joinRoom(roomId, storedUserId, storedUserName);

                // Register event handlers
                socketClient.on(MessageType.ROOM_DATA, handleRoomData);
                socketClient.on(MessageType.ERROR, handleError);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to connect");
            }
        };

        connect();

        // Cleanup on unmount
        return () => {
            if (socketClient) {
                socketClient.off(MessageType.ROOM_DATA, handleRoomData);
                socketClient.off(MessageType.ERROR, handleError);
                socketClient.leaveRoom();
            }
        };
    }, [roomId, router]);

    // Handle room data updates
    const handleRoomData = (payload: any) => {
        setRoom(payload.room);
        setStories(payload.stories || []);
        setUsers(payload.users || []);
        setVotes(payload.votes || []);
        setCurrentStory(payload.currentStory || null);

        // Check if user is admin
        const user = payload.users?.find((u: RoomUser) => u.userId === userId);
        setIsAdmin(user?.isAdmin || false);
    };

    // Handle WebSocket errors
    const handleError = (payload: any) => {
        setError(payload.message || "An error occurred");
    };

    // Handle story selection
    const handleStorySelect = (storyId: string) => {
        const story = stories.find((s) => s.id === storyId);
        if (story) {
            setCurrentStory(story);
        }
    };

    // Handle voting
    const handleVote = (value: string) => {
        if (currentStory && socketClient) {
            socketClient.vote(roomId, currentStory.id, userId, value);
        }
    };

    // Handle revealing votes
    const handleRevealVotes = () => {
        if (currentStory && socketClient) {
            socketClient.revealVotes(roomId, currentStory.id);
        }
    };

    // Handle resetting votes
    const handleResetVotes = () => {
        if (currentStory && socketClient) {
            socketClient.resetVotes(roomId, currentStory.id);
        }
    };

    // Handle moving to next story
    const handleNextStory = () => {
        if (currentStory && socketClient) {
            socketClient.nextStory(roomId, currentStory.id);
        }
    };

    // Handle creating a new story
    const handleCreateStory = (title: string, description: string) => {
        if (socketClient) {
            socketClient.createStory(roomId, title, description);
        }
    };

    // Copy room code
    const copyRoomCode = () => {
        if (room) {
            navigator.clipboard.writeText(room.roomCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    // Show error if connection failed
    if (error) {
        return (
            <Box sx={{
                minHeight: '100vh',
                bgcolor: 'background.default',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                p: 2
            }}>
                <Paper elevation={3} sx={{ maxWidth: 'sm', width: '100%', p: 4, borderRadius: 2 }}>
                    <Typography variant="h5" color="error" sx={{ mb: 2, fontWeight: 'bold' }}>
                        Error
                    </Typography>
                    <Typography sx={{ mb: 3 }}>{error}</Typography>
                    <Button
                        component={Link}
                        href="/"
                        variant="contained"
                        color="primary"
                        fullWidth
                    >
                        Back to Home
                    </Button>
                </Paper>
            </Box>
        );
    }

    // Show loading state
    if (!isConnected || !room) {
        return (
            <Box sx={{
                minHeight: '100vh',
                bgcolor: 'background.default',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h5" sx={{ mb: 3, fontWeight: 'medium' }}>
                        Connecting to room...
                    </Typography>
                    <CircularProgress />
                </Box>
            </Box>
        );
    }

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', p: 2 }}>
            <Container maxWidth="xl">
                <Paper elevation={3} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
                    <Box sx={{
                        display: 'flex',
                        flexDirection: { xs: 'column', md: 'row' },
                        justifyContent: 'space-between',
                        alignItems: { xs: 'flex-start', md: 'center' },
                        gap: 2
                    }}>
                        <Box>
                            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                                {room.name}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                                <Typography color="textSecondary" sx={{ mr: 1 }}>
                                    Room Code:
                                </Typography>
                                <Chip
                                    label={room.roomCode}
                                    color="primary"
                                    variant="outlined"
                                    sx={{ fontFamily: 'monospace' }}
                                />
                            </Box>
                        </Box>
                        <Box sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            mt: { xs: 2, md: 0 }
                        }}>
                            <IconButton
                                onClick={copyRoomCode}
                                color={copied ? "success" : "default"}
                                title="Copy room code"
                            >
                                <ContentCopyIcon />
                            </IconButton>
                            <Button
                                component={Link}
                                href="/"
                                color="error"
                                variant="outlined"
                                startIcon={<ExitToAppIcon />}
                            >
                                Leave Room
                            </Button>
                            <ThemeToggle />
                        </Box>
                    </Box>
                </Paper>

                <Grid container spacing={3}>
                    <Grid item xs={12} lg={3}>
                        <UserList
                            users={users}
                            votes={votes}
                            currentStoryId={currentStory?.id}
                            isRevealed={currentStory?.isRevealed || false}
                        />
                    </Grid>

                    <Grid item xs={12} lg={9}>
                        <Paper elevation={3} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
                            {currentStory ? (
                                <Box>
                                    <Typography variant="h5" sx={{ fontWeight: 'medium', mb: 1 }}>
                                        {currentStory.title}
                                    </Typography>
                                    {currentStory.description && (
                                        <Typography color="textSecondary" sx={{ mb: 2 }}>
                                            {currentStory.description}
                                        </Typography>
                                    )}

                                    <VotingPanel
                                        storyId={currentStory.id}
                                        userId={userId}
                                        roomId={roomId}
                                        isRevealed={currentStory.isRevealed}
                                        votes={votes}
                                        onVote={handleVote}
                                        onReveal={handleRevealVotes}
                                        onReset={handleResetVotes}
                                        onNextStory={handleNextStory}
                                        isAdmin={isAdmin}
                                    />
                                </Box>
                            ) : (
                                <Box sx={{ textAlign: 'center', py: 5 }}>
                                    <Typography variant="h5" sx={{ mb: 1, fontWeight: 'medium' }}>
                                        No Active Story
                                    </Typography>
                                    <Typography color="textSecondary">
                                        {stories.length > 0
                                            ? "Select a story from the list to start estimating"
                                            : "No stories have been added yet"}
                                    </Typography>
                                </Box>
                            )}
                        </Paper>

                        <StoryList
                            stories={stories}
                            currentStoryId={currentStory?.id}
                            onStorySelect={handleStorySelect}
                            onCreateStory={handleCreateStory}
                            isAdmin={isAdmin}
                        />
                    </Grid>
                </Grid>
            </Container>
        </Box>
    );
};

export default RoomPage;