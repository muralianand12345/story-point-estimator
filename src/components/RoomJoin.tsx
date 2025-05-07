"use client"

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';

const RoomJoin: React.FC = () => {
    const router = useRouter();
    const [roomCode, setRoomCode] = useState("");
    const [userName, setUserName] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Load username from localStorage if available
    useEffect(() => {
        const savedUserName = localStorage.getItem("userName");
        if (savedUserName) {
            setUserName(savedUserName);
        }
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!roomCode.trim() || !userName.trim()) {
            setError("Please fill in all fields");
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // Generate a user ID or get from localStorage if exists
            let userId = localStorage.getItem("userId");
            if (!userId) {
                userId = uuidv4();
                localStorage.setItem("userId", userId);
            }

            // Save username in localStorage
            localStorage.setItem("userName", userName);

            // Join room via API
            const response = await fetch("/api/room/join", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    roomCode,
                    userId,
                    userName,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to join room");
            }

            // Navigate to the room
            router.push(`/room/${data.room.id}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Paper elevation={3} sx={{ maxWidth: 'md', mx: 'auto', p: 3, borderRadius: 2 }}>
            <Typography variant="h4" component="h2" sx={{ mb: 3, textAlign: 'center', fontWeight: 'bold' }}>
                Join a Room
            </Typography>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit}>
                <TextField
                    fullWidth
                    id="roomCode"
                    label="Room Code"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                    placeholder="Enter 6-digit room code"
                    disabled={isLoading}
                    required
                    inputProps={{ maxLength: 6 }}
                    margin="normal"
                />

                <TextField
                    fullWidth
                    id="userName"
                    label="Your Name"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="Enter your name"
                    disabled={isLoading}
                    required
                    margin="normal"
                />

                <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    fullWidth
                    disabled={isLoading}
                    sx={{ mt: 3 }}
                >
                    {isLoading ? "Joining..." : "Join Room"}
                </Button>
            </Box>
        </Paper>
    );
};

export default RoomJoin;