import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    Box,
    Typography,
    Avatar,
    useTheme
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';

interface UserNameDialogProps {
    open: boolean;
    onSubmit: (name: string) => void;
}

const UserNameDialog = ({ open, onSubmit }: UserNameDialogProps) => {
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const theme = useTheme();

    const handleSubmit = () => {
        if (!name.trim()) {
            setError('Please enter your name');
            return;
        }

        if (name.trim().length < 2) {
            setError('Name must be at least 2 characters');
            return;
        }

        if (name.trim().length > 20) {
            setError('Name must not exceed 20 characters');
            return;
        }

        onSubmit(name.trim());
    };

    return (
        <Dialog
            open={open}
            maxWidth="sm"
            fullWidth
            disableEscapeKeyDown
            disablePortal
        >
            <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
                Join Room
            </DialogTitle>

            <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pt: 2 }}>
                    <Avatar
                        sx={{
                            width: 80,
                            height: 80,
                            mb: 2,
                            bgcolor: theme.palette.primary.main
                        }}
                    >
                        <PersonIcon sx={{ fontSize: 40 }} />
                    </Avatar>

                    <Typography variant="body1" gutterBottom>
                        Enter your name to join the estimation session
                    </Typography>

                    <TextField
                        autoFocus
                        margin="dense"
                        label="Your Name"
                        fullWidth
                        variant="outlined"
                        value={name}
                        onChange={(e) => {
                            setName(e.target.value);
                            setError('');
                        }}
                        error={!!error}
                        helperText={error}
                        sx={{ mt: 2, maxWidth: 400 }}
                        onKeyPress={(e) => {
                            if (e.key === 'Enter' && !error) {
                                handleSubmit();
                            }
                        }}
                    />
                </Box>
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 3, justifyContent: 'center' }}>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    size="large"
                    fullWidth
                    sx={{ maxWidth: 400 }}
                >
                    Continue
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default UserNameDialog;