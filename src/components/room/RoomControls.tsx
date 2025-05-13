import React, { useState } from 'react';
import {
    Box,
    Button,
    IconButton,
    Tooltip,
    Typography,
    TextField,
    InputAdornment,
    Snackbar,
    Alert,
    useTheme,
    Paper
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import HistoryIcon from '@mui/icons-material/History';
import { useRouter } from 'next/navigation';

interface RoomControlsProps {
    roomId: string;
    onShowHistory: () => void;
    onLeaveRoom: () => void;
}

const RoomControls = ({ roomId, onShowHistory, onLeaveRoom }: RoomControlsProps) => {
    const theme = useTheme();
    const [copied, setCopied] = useState(false);
    const router = useRouter();

    const roomUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/room/${roomId}`
        : '';

    const handleCopyLink = () => {
        if (navigator.clipboard && roomUrl) {
            navigator.clipboard.writeText(roomUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 3000);
        }
    };

    const handleCopyRoomId = () => {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(roomId);
            setCopied(true);
            setTimeout(() => setCopied(false), 3000);
        }
    };

    return (
        <Paper
            elevation={2}
            sx={{
                p: 2,
                mb: 3,
                borderRadius: 2,
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 2
            }}
        >
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <Button
                    startIcon={<HistoryIcon />}
                    variant="outlined"
                    onClick={onShowHistory}
                >
                    Vote History
                </Button>

                <Tooltip title="Leave room">
                    <Button
                        startIcon={<ExitToAppIcon />}
                        variant="outlined"
                        color="error"
                        onClick={onLeaveRoom}
                    >
                        Leave
                    </Button>
                </Tooltip>
            </Box>

            <Box sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: { xs: 'stretch', sm: 'center' },
                gap: 2,
                width: { xs: '100%', sm: 'auto' }
            }}>
                <TextField
                    size="small"
                    variant="outlined"
                    value={roomId}
                    label="Room Code"
                    InputProps={{
                        readOnly: true,
                        endAdornment: (
                            <InputAdornment position="end">
                                <Tooltip title="Copy room code">
                                    <IconButton
                                        edge="end"
                                        onClick={handleCopyRoomId}
                                    >
                                        <ContentCopyIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                            </InputAdornment>
                        ),
                    }}
                    sx={{ width: { xs: '100%', sm: 200 } }}
                />

                <TextField
                    size="small"
                    variant="outlined"
                    value={roomUrl}
                    label="Invite Link"
                    InputProps={{
                        readOnly: true,
                        endAdornment: (
                            <InputAdornment position="end">
                                <Tooltip title="Copy invite link">
                                    <IconButton
                                        edge="end"
                                        onClick={handleCopyLink}
                                    >
                                        <ContentCopyIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                            </InputAdornment>
                        ),
                    }}
                    sx={{ width: { xs: '100%', sm: 300 } }}
                />
            </Box>

            <Snackbar
                open={copied}
                autoHideDuration={3000}
                onClose={() => setCopied(false)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert severity="success" variant="filled">
                    Copied to clipboard!
                </Alert>
            </Snackbar>
        </Paper>
    );
};

export default RoomControls;