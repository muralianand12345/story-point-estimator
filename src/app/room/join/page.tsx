"use client"

import React from "react";
import Link from "next/link";
import RoomJoin from "@/components/RoomJoin";
import { ThemeToggle } from "@/components/theme-toggle";
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const JoinRoomPage: React.FC = () => {
    return (
        <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', py: 6, px: 2 }}>
            <Container maxWidth="md">
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                    <Button
                        component={Link}
                        href="/"
                        startIcon={<ArrowBackIcon />}
                        color="primary"
                    >
                        Back to Home
                    </Button>
                    <ThemeToggle />
                </Box>

                <RoomJoin />
            </Container>
        </Box>
    );
};

export default JoinRoomPage;