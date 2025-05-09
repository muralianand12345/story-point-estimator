'use client';

import { Inter } from 'next/font/google';
import ThemeProvider from '@/components/ThemeProvider';
import './globals.css';

// Configure the Inter font
const inter = Inter({
    subsets: ['latin'],
    display: 'swap',
});

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <head>
                <title>Story Point Estimator</title>
                <meta name="description" content="A collaborative tool for agile story point estimation" />
            </head>
            <body className={inter.className}>
                <ThemeProvider>
                    {children}
                </ThemeProvider>
            </body>
        </html>
    );
}