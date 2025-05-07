"use client"

import React, { ReactNode } from "react";
import MuiButton from '@mui/material/Button';
import { styled } from '@mui/material/styles';
import CircularProgress from '@mui/material/CircularProgress';

type ButtonVariant = "primary" | "secondary" | "success" | "danger" | "outline";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps {
    children: ReactNode;
    variant?: ButtonVariant;
    size?: ButtonSize;
    className?: string;
    fullWidth?: boolean;
    onClick?: () => void;
    type?: "button" | "submit" | "reset";
    disabled?: boolean;
    icon?: ReactNode;
}

// Map our custom variants to Material UI variants
const getVariantMapping = (variant: ButtonVariant) => {
    switch (variant) {
        case "primary":
            return { muiVariant: "contained", color: "primary" };
        case "secondary":
            return { muiVariant: "contained", color: "secondary" };
        case "success":
            return { muiVariant: "contained", color: "success" };
        case "danger":
            return { muiVariant: "contained", color: "error" };
        case "outline":
            return { muiVariant: "outlined", color: "primary" };
        default:
            return { muiVariant: "contained", color: "primary" };
    }
};

// Map our custom sizes to Material UI sizes
const getSizeMapping = (size: ButtonSize) => {
    switch (size) {
        case "sm":
            return "small";
        case "md":
            return "medium";
        case "lg":
            return "large";
        default:
            return "medium";
    }
};

const Button: React.FC<ButtonProps> = ({
    children,
    variant = "primary",
    size = "md",
    className = "",
    fullWidth = false,
    onClick,
    type = "button",
    disabled = false,
    icon,
}) => {
    const { muiVariant, color } = getVariantMapping(variant);
    const muiSize = getSizeMapping(size);

    return (
        <MuiButton
            variant={muiVariant as any}
            color={color as any}
            size={muiSize}
            fullWidth={fullWidth}
            onClick={onClick}
            type={type}
            disabled={disabled}
            className={className}
            startIcon={icon}
        >
            {children}
        </MuiButton>
    );
};

export default Button;