import type { Metadata } from 'next';
import ThemeProvider from '@/components/ThemeProvider';
import { Inter } from 'next/font/google';
import './globals.css';

// Configure the Inter font
const inter = Inter({
    subsets: ['latin'],
    display: 'swap',
});

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
            <body className={inter.className}>
                <ThemeProvider>
                    {children}
                </ThemeProvider>
            </body>
        </html>
    );
}