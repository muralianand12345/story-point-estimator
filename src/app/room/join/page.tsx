"use client"

import type React from "react"
import Link from "next/link"
import RoomJoin from "@/components/RoomJoin"
import { ThemeToggle } from "@/components/theme-toggle"

const JoinRoomPage: React.FC = () => {
    return (
        <div className="min-h-screen bg-background flex flex-col py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto w-full">
                <div className="flex justify-between items-center mb-8">
                    <Link href="/" className="text-primary hover:text-primary/90">
                        &larr; Back to Home
                    </Link>
                    <ThemeToggle />
                </div>

                <RoomJoin />
            </div>
        </div>
    )
}

export default JoinRoomPage
