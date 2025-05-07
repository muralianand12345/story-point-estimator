"use client"

import type React from "react"
import type { ReactNode } from "react"

type ButtonVariant = "primary" | "secondary" | "success" | "danger" | "outline"
type ButtonSize = "sm" | "md" | "lg"

interface ButtonProps {
    children: ReactNode
    variant?: ButtonVariant
    size?: ButtonSize
    className?: string
    fullWidth?: boolean
    onClick?: () => void
    type?: "button" | "submit" | "reset"
    disabled?: boolean
    icon?: ReactNode
}

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
    const baseClasses =
        "inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring"

    const variantClasses = {
        primary: "bg-primary hover:bg-primary/90 text-primary-foreground",
        secondary: "bg-secondary hover:bg-secondary/90 text-secondary-foreground",
        success: "bg-green-600 hover:bg-green-700 text-white dark:bg-green-600 dark:hover:bg-green-700",
        danger: "bg-destructive hover:bg-destructive/90 text-destructive-foreground",
        outline: "bg-background border border-input text-foreground hover:bg-accent hover:text-accent-foreground",
    }

    const sizeClasses = {
        sm: "text-sm px-3 py-1.5",
        md: "text-base px-4 py-2",
        lg: "text-lg px-6 py-3",
    }

    const widthClass = fullWidth ? "w-full" : ""
    const disabledClass = disabled ? "opacity-50 cursor-not-allowed" : "shadow-sm"

    return (
        <button
            type={type}
            className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${widthClass} ${disabledClass} ${className}`}
            onClick={onClick}
            disabled={disabled}
        >
            {icon && <span className="mr-2">{icon}</span>}
            {children}
        </button>
    )
}

export default Button
