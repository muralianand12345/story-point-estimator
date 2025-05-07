"use client"

import React from "react";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';

const HomePage: React.FC = () => {
    return (
        <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
            <Container maxWidth="lg" sx={{ px: 2, py: 8 }}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 4 }}>
                    <ThemeToggle />
                </Box>

                <Box sx={{ textAlign: 'center', mb: 8 }}>
                    <Typography variant="h2" component="h1" sx={{ fontWeight: 800, mb: 2 }}>
                        Story Point Estimator
                    </Typography>
                    <Typography variant="h5" color="textSecondary" sx={{ maxWidth: 'md', mx: 'auto' }}>
                        A collaborative planning poker tool for agile teams to estimate story points efficiently
                    </Typography>
                </Box>

                <Box sx={{ maxWidth: 'sm', mx: 'auto', mb: 8 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Button
                            component={Link}
                            href="/room/create"
                            variant="contained"
                            color="primary"
                            size="large"
                            startIcon={<AddIcon />}
                            sx={{ py: 1.5, fontSize: '1.1rem', borderRadius: 2 }}
                        >
                            Create a Room
                        </Button>

                        <Button
                            component={Link}
                            href="/room/join"
                            variant="outlined"
                            size="large"
                            startIcon={<ArrowBackIcon />}
                            sx={{ py: 1.5, fontSize: '1.1rem', borderRadius: 2 }}
                        >
                            Join a Room
                        </Button>
                    </Box>
                </Box>

                <Grid container spacing={4} sx={{ maxWidth: 'lg', mx: 'auto' }}>
                    <Grid item xs={12} md={4}>
                        <Paper
                            elevation={3}
                            sx={{
                                p: 4,
                                borderRadius: 4,
                                height: '100%',
                                textAlign: 'center',
                                transform: 'scale(1)',
                                transition: 'transform 0.3s ease',
                                '&:hover': {
                                    transform: 'scale(1.05)'
                                }
                            }}
                        >
                            <Box
                                sx={{
                                    height: 64,
                                    width: 64,
                                    borderRadius: '50%',
                                    bgcolor: 'primary.light',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    mx: 'auto',
                                    mb: 3
                                }}
                            >
                                <AddCircleOutlineIcon sx={{ color: 'primary.main', fontSize: 32 }} />
                            </Box>
                            <Typography variant="h5" component="h3" fontWeight="bold" sx={{ mb: 1.5 }}>
                                Create
                            </Typography>
                            <Typography color="textSecondary">
                                Create a room and invite your team members to join for estimation sessions
                            </Typography>
                        </Paper>
                    </Grid>

                    <Grid item xs={12} md={4}>
                        <Paper
                            elevation={3}
                            sx={{
                                p: 4,
                                borderRadius: 4,
                                height: '100%',
                                textAlign: 'center',
                                transform: 'scale(1)',
                                transition: 'transform 0.3s ease',
                                '&:hover': {
                                    transform: 'scale(1.05)'
                                }
                            }}
                        >
                            <Box
                                sx={{
                                    height: 64,
                                    width: 64,
                                    borderRadius: '50%',
                                    bgcolor: 'success.light',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    mx: 'auto',
                                    mb: 3
                                }}
                            >
                                <AssignmentOutlinedIcon sx={{ color: 'success.main', fontSize: 32 }} />
                            </Box>
                            <Typography variant="h5" component="h3" fontWeight="bold" sx={{ mb: 1.5 }}>
                                Estimate
                            </Typography>
                            <Typography color="textSecondary">
                                Vote on story points in real-time with your team for efficient estimation
                            </Typography>
                        </Paper>
                    </Grid>

                    <Grid item xs={12} md={4}>
                        <Paper
                            elevation={3}
                            sx={{
                                p: 4,
                                borderRadius: 4,
                                height: '100%',
                                textAlign: 'center',
                                transform: 'scale(1)',
                                transition: 'transform 0.3s ease',
                                '&:hover': {
                                    transform: 'scale(1.05)'
                                }
                            }}
                        >
                            <Box
                                sx={{
                                    height: 64,
                                    width: 64,
                                    borderRadius: '50%',
                                    bgcolor: 'purple.100',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    mx: 'auto',
                                    mb: 3
                                }}
                            >
                                <CheckCircleOutlinedIcon sx={{ color: 'purple.600', fontSize: 32 }} />
                            </Box>
                            <Typography variant="h5" component="h3" fontWeight="bold" sx={{ mb: 1.5 }}>
                                Decide
                            </Typography>
                            <Typography color="textSecondary">
                                Reveal votes and reach consensus on story point estimates as a team
                            </Typography>
                        </Paper>
                    </Grid>
                </Grid>
            </Container>

            <Box component="footer" sx={{ py: 4, mt: 10, borderTop: 1, borderColor: 'divider' }}>
                <Container maxWidth="lg">
                    <Typography align="center" color="textSecondary">
                        Story Point Estimator - A collaboration tool for agile teams
                    </Typography>
                </Container>
            </Box>
        </Box>
    );
};

export default HomePage;