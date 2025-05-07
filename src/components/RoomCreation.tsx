"use client"

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import InputAdornment from '@mui/material/InputAdornment';
import HomeIcon from '@mui/icons-material/Home';
import PersonIcon from '@mui/icons-material/Person';
import CircularProgress from '@mui/material/CircularProgress';
import Button from "./Button";

const RoomCreation: React.FC = () => {
    const router = useRouter();
    const [roomName, setRoomName] = useState("");
    const [userName, setUserName] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!roomName.trim() || !userName.trim()) {
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

            // Create room via API
            const response = await fetch("/api/room/create", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: roomName,
                    userId,
                    userName,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to create room");
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
        <Paper
            elevation={3}
            sx={{
                maxWidth: 'md',
                mx: 'auto',
                p: 4,
                borderRadius: 2
            }}
        >
            <Typography
                variant="h4"
                component="h2"
                sx={{ mb: 3, textAlign: 'center', fontWeight: 'bold' }}
            >
                Create a New Room
            </Typography>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
                <TextField
                    fullWidth
                    id="roomName"
                    label="Room Name"
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    placeholder="Sprint Planning"
                    disabled={isLoading}
                    required
                    margin="normal"
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <HomeIcon />
                            </InputAdornment>
                        ),
                    }}
                />

                <TextField
                    fullWidth
                    id="userName"
                    label="Your Name"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="Your name"
                    disabled={isLoading}
                    required
                    margin="normal"
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <PersonIcon />
                            </InputAdornment>
                        ),
                    }}
                />

                <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    fullWidth
                    disabled={isLoading}
                    icon={isLoading ? <CircularProgress size={24} color="inherit" /> : undefined}
                    className="mt-4"
                >
                    {isLoading ? "Creating..." : "Create Room"}
                </Button>
            </Box>
        </Paper>
    );
};

export default RoomCreation;