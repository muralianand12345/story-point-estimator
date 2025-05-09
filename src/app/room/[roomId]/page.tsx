'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    Container,
    Box,
    Grid,
    CircularProgress,
    Typography,
    Alert,
    useTheme,
    useMediaQuery
} from '@mui/material';
import { Socket } from 'socket.io-client';
import RoomHeader from '@/components/room/RoomHeader';
import UserList from '@/components/room/UserList';
import socketService from '@/lib/socketService';
import VotingArea from '@/components/room/VotingArea';
import { Room, User, SocketEvent } from '@/types';

const RoomPage: React.FC = () => {
    const { roomId } = useParams<{ roomId: string }>();
    const router = useRouter();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>('');
    const [room, setRoom] = useState<Room | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [userId, setUserId] = useState<string>('');
    const [socket, setSocket] = useState<Socket | null>(null);

    // Initialize user data from localStorage
    useEffect(() => {
        const storedUserId = localStorage.getItem('userId');

        if (!storedUserId) {
            router.push(`/room/join/${roomId}`);
            return;
        }

        setUserId(storedUserId);
    }, [roomId, router]);

    // Fetch room data
    useEffect(() => {
        const fetchRoomData = async () => {
            if (!userId) return;

            try {
                const response = await fetch(`/api/room/${roomId}`);

                if (!response.ok) {
                    if (response.status === 404) {
                        setError('Room not found or inactive');
                        return;
                    }
                    throw new Error('Failed to fetch room data');
                }

                const data = await response.json();
                setRoom(data.room);
                setUsers(data.users);
                setIsLoading(false);
            } catch (error) {
                console.error('Error fetching room data:', error);
                setError('Failed to load room data');
                setIsLoading(false);
            }
        };

        if (userId) {
            fetchRoomData();
        }
    }, [roomId, userId]);

    // Initialize socket connection
    useEffect(() => {
        if (!userId || !roomId || !room) return;

        // Connect to socket
        const socketInstance = socketService.connect(roomId as string, userId);
        setSocket(socketInstance);

        // Socket event listeners
        socketInstance.on(SocketEvent.USER_JOINED, async () => {
            try {
                const response = await fetch(`/api/room/${roomId}`);
                if (response.ok) {
                    const data = await response.json();
                    setUsers(data.users);
                }
            } catch (error) {
                console.error('Error updating users after join:', error);
            }
        });

        socketInstance.on(SocketEvent.USER_LEFT, async (leftUserId: string) => {
            try {
                const response = await fetch(`/api/room/${roomId}`);
                if (response.ok) {
                    const data = await response.json();
                    setRoom(data.room);
                    setUsers(data.users);
                }
            } catch (error) {
                console.error('Error updating users after leave:', error);
            }
        });

        socketInstance.on(SocketEvent.HOST_CHANGED, (newHostId: string) => {
            if (room) {
                setRoom({ ...room, hostId: newHostId });
            }
        });

        socketInstance.on(SocketEvent.KICKED, () => {
            // Clear user data and redirect to home
            localStorage.removeItem('userId');
            localStorage.removeItem('userName');
            router.push('/');
        });

        // Cleanup on unmount
        return () => {
            socketService.disconnect();
        };
    }, [roomId, userId, room, router]);

    const handleKickUser = (kickUserId: string) => {
        if (userId === room?.hostId) {
            socketService.kickUser(kickUserId);
        }
    };

    const handleLeaveRoom = () => {
        // Clear user data
        localStorage.removeItem('userId');
        localStorage.removeItem('userName');

        // Disconnect socket
        socketService.leaveRoom();

        // Redirect to home
        router.push('/');
    };

    if (isLoading) {
        return (
            <Container>
                <Box sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '100vh'
                }}>
                    <CircularProgress />
                    <Typography variant="body1" sx={{ mt: 2 }}>
                        Loading room...
                    </Typography>
                </Box>
            </Container>
        );
    }

    if (error || !room) {
        return (
            <Container>
                <Box sx={{ mt: 4 }}>
                    <Alert severity="error">{error || 'Room not found'}</Alert>
                    <Box sx={{ mt: 2, textAlign: 'center' }}>
                        <Typography variant="body1" gutterBottom>
                            The room you're trying to access doesn't exist or is no longer active.
                        </Typography>
                        <Typography
                            variant="body2"
                            color="primary"
                            sx={{ cursor: 'pointer', mt: 1 }}
                            onClick={() => router.push('/')}
                        >
                            Create a new room
                        </Typography>
                    </Box>
                </Box>
            </Container>
        );
    }

    const inviteLink = typeof window !== 'undefined'
        ? `${window.location.origin}/room/join/${roomId}`
        : '';

    return (
        <Container
            maxWidth="lg"
            sx={{
                py: 4,
                minHeight: '100vh',
                backgroundColor: 'transparent'
            }}
        >
            <RoomHeader
                roomName={room.name}
                roomCode={room.roomCode}
                inviteLink={inviteLink}
                onLeaveRoom={handleLeaveRoom}
            />

            <Grid container spacing={3}>
                {/* Main estimation area */}
                <Grid item xs={12} md={8}>
                    <VotingArea
                        users={users}
                        currentUserId={userId}
                        isHost={userId === room.hostId}
                    />
                </Grid>

                {/* User list */}
                <Grid item xs={12} md={4}>
                    <UserList
                        users={users}
                        currentUserId={userId}
                        hostId={room.hostId}
                        onKickUser={handleKickUser}
                    />
                </Grid>
            </Grid>
        </Container>
    );
};

export default RoomPage;