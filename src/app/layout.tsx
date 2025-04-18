import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { RoomProvider } from "../context/RoomContext";
import ThemeProvider from "../context/ThemeContext";
import { Analytics } from "@vercel/analytics/react"

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "Story Point Estimator",
    description: "Collaborative story point estimation for agile teams",
};

const RootLayout = async ({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) => {
    return (
        <html lang="en" suppressHydrationWarning>
            <Analytics/>
            <body
                className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen transition-colors`}
            >
                <ThemeProvider>
                    <RoomProvider>{children}</RoomProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}

export default RootLayout;