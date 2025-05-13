import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    useTheme
} from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';

interface KickUserDialogProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    userName: string;
}

const KickUserDialog = ({ open, onClose, onConfirm, userName }: KickUserDialogProps) => {
    const theme = useTheme();

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
                Remove User
            </DialogTitle>

            <DialogContent>
                <Box sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    pt: 1
                }}>
                    <WarningIcon
                        sx={{
                            fontSize: 64,
                            color: theme.palette.warning.main,
                            mb: 2
                        }}
                    />

                    <Typography variant="body1" align="center">
                        Are you sure you want to remove <strong>{userName}</strong> from this room?
                    </Typography>

                    <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 2 }}>
                        This action cannot be undone. The user will need to rejoin if they want to participate again.
                    </Typography>
                </Box>
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 3, justifyContent: 'center', gap: 2 }}>
                <Button
                    onClick={onClose}
                    variant="outlined"
                    fullWidth
                >
                    Cancel
                </Button>
                <Button
                    onClick={onConfirm}
                    variant="contained"
                    color="error"
                    fullWidth
                >
                    Remove
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default KickUserDialog;