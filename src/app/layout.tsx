import React from 'react';
import { Metadata } from 'next';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import { ThemeProvider } from '../components/theme/ThemeProvider';

export const metadata: Metadata = {
    title: 'Story Point Estimator',
    description: 'A collaborative tool for agile story point estimation',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body>
                <AppRouterCacheProvider>
                    <ThemeProvider>
                        {children}
                    </ThemeProvider>
                </AppRouterCacheProvider>
            </body>
        </html>
    );
}