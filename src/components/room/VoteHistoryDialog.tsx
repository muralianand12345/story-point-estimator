import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    List,
    ListItem,
    ListItemText,
    Typography,
    Box,
    Chip,
    Divider,
    IconButton,
    useTheme
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { VoteHistory } from '../../types/room';

interface VoteHistoryDialogProps {
    open: boolean;
    onClose: () => void;
    history: VoteHistory[];
}

const VoteHistoryDialog = ({ open, onClose, history }: VoteHistoryDialogProps) => {
    const theme = useTheme();

    // Format timestamp to readable date
    const formatDate = (timestamp: number): string => {
        return new Date(timestamp).toLocaleString();
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
        >
            <DialogTitle sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: `1px solid ${theme.palette.divider}`
            }}>
                <Typography variant="h6">Vote History</Typography>
                <IconButton edge="end" color="inherit" onClick={onClose} aria-label="close">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent dividers sx={{ p: 0 }}>
                {history.length === 0 ? (
                    <Box sx={{ p: 3, textAlign: 'center' }}>
                        <Typography color="text.secondary">
                            No vote history yet. Complete some estimations to see them here.
                        </Typography>
                    </Box>
                ) : (
                    <List sx={{ width: '100%' }}>
                        {history.map((item, index) => (
                            <React.Fragment key={item.id}>
                                <ListItem alignItems="flex-start" sx={{ flexDirection: 'column', py: 2 }}>
                                    <Box sx={{
                                        display: 'flex',
                                        width: '100%',
                                        justifyContent: 'space-between',
                                        mb: 1
                                    }}>
                                        <Typography variant="subtitle1" fontWeight="bold">
                                            {item.issueName}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {formatDate(item.timestamp)}
                                        </Typography>
                                    </Box>

                                    <Box sx={{
                                        display: 'flex',
                                        width: '100%',
                                        alignItems: 'center',
                                        mb: 1
                                    }}>
                                        <Chip
                                            label={`Final Score: ${item.finalScore || 'Not set'}`}
                                            color="primary"
                                            sx={{ mr: 1 }}
                                        />
                                    </Box>

                                    <Box sx={{
                                        display: 'flex',
                                        flexWrap: 'wrap',
                                        gap: 1,
                                        mt: 1
                                    }}>
                                        {item.votes.map((vote) => (
                                            <Chip
                                                key={vote.userId}
                                                label={`${vote.userName}: ${vote.vote}`}
                                                variant="outlined"
                                                size="small"
                                            />
                                        ))}
                                    </Box>
                                </ListItem>
                                {index < history.length - 1 && <Divider component="li" />}
                            </React.Fragment>
                        ))}
                    </List>
                )}
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose} color="primary">
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default VoteHistoryDialog;