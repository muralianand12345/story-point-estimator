'use client';

import React, { useState } from 'react';
import {
    Box,
    TextField,
    Button,
    Snackbar,
    IconButton
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CloseIcon from '@mui/icons-material/Close';

interface InviteLinkProps {
    inviteLink: string;
}

const InviteLink: React.FC<InviteLinkProps> = ({ inviteLink }) => {
    const [open, setOpen] = useState<boolean>(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(inviteLink);
        setOpen(true);
    };

    const handleClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
        if (reason === 'clickaway') {
            return;
        }
        setOpen(false);
    };

    return (
        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
            <TextField
                fullWidth
                size="small"
                value={inviteLink}
                InputProps={{
                    readOnly: true,
                }}
                sx={{ mr: 1 }}
            />
            <Button
                variant="contained"
                color="primary"
                startIcon={<ContentCopyIcon />}
                onClick={handleCopy}
            >
                Copy
            </Button>
            <Snackbar
                open={open}
                autoHideDuration={3000}
                onClose={handleClose}
                message="Link copied to clipboard"
                action={
                    <IconButton
                        size="small"
                        color="inherit"
                        onClick={handleClose}
                    >
                        <CloseIcon fontSize="small" />
                    </IconButton>
                }
            />
        </Box>
    );
};

export default InviteLink;