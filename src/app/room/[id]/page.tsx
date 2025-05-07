"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { socketClient } from "@/lib/socket"
import { MessageType, type RoomUser, type Story, type Vote, type Room } from "@/lib/types"
import UserList from "@/components/UserList"
import StoryList from "@/components/StoryList"
import VotingPanel from "@/components/VotingPanel"
import { ThemeToggle } from "@/components/theme-toggle"

const RoomPage: React.FC = () => {
    const params = useParams()
    const router = useRouter()
    const roomId = params.id as string

    const [userId, setUserId] = useState<string>("")
    const [userName, setUserName] = useState<string>("")
    const [room, setRoom] = useState<Room | null>(null)
    const [stories, setStories] = useState<Story[]>([])
    const [users, setUsers] = useState<RoomUser[]>([])
    const [votes, setVotes] = useState<Vote[]>([])
    const [currentStory, setCurrentStory] = useState<Story | null>(null)
    const [isAdmin, setIsAdmin] = useState(false)
    const [isConnected, setIsConnected] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Initialize connection and data
    useEffect(() => {
        // Check if user ID exists in localStorage
        const storedUserId = localStorage.getItem("userId")
        const storedUserName = localStorage.getItem("userName")

        if (!storedUserId || !storedUserName) {
            // Redirect to join page if no user data
            router.push("/room/join")
            return
        }

        setUserId(storedUserId)
        setUserName(storedUserName)

        // Connect to WebSocket
        const connect = async () => {
            try {
                if (!socketClient) {
                    throw new Error("WebSocket client not available")
                }

                await socketClient.connect()
                setIsConnected(true)

                // Join room
                socketClient.joinRoom(roomId, storedUserId, storedUserName)

                // Register event handlers
                socketClient.on(MessageType.ROOM_DATA, handleRoomData)
                socketClient.on(MessageType.ERROR, handleError)
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to connect")
            }
        }

        connect()

        // Cleanup on unmount
        return () => {
            if (socketClient) {
                socketClient.off(MessageType.ROOM_DATA, handleRoomData)
                socketClient.off(MessageType.ERROR, handleError)
                socketClient.leaveRoom()
            }
        }
    }, [roomId, router])

    // Handle room data updates
    const handleRoomData = (payload: any) => {
        setRoom(payload.room)
        setStories(payload.stories || [])
        setUsers(payload.users || [])
        setVotes(payload.votes || [])
        setCurrentStory(payload.currentStory || null)

        // Check if user is admin
        const user = payload.users?.find((u: RoomUser) => u.userId === userId)
        setIsAdmin(user?.isAdmin || false)
    }

    // Handle WebSocket errors
    const handleError = (payload: any) => {
        setError(payload.message || "An error occurred")
    }

    // Handle story selection
    const handleStorySelect = (storyId: string) => {
        const story = stories.find((s) => s.id === storyId)
        if (story) {
            setCurrentStory(story)
        }
    }

    // Handle voting
    const handleVote = (value: string) => {
        if (currentStory && socketClient) {
            socketClient.vote(roomId, currentStory.id, userId, value)
        }
    }

    // Handle revealing votes
    const handleRevealVotes = () => {
        if (currentStory && socketClient) {
            socketClient.revealVotes(roomId, currentStory.id)
        }
    }

    // Handle resetting votes
    const handleResetVotes = () => {
        if (currentStory && socketClient) {
            socketClient.resetVotes(roomId, currentStory.id)
        }
    }

    // Handle moving to next story
    const handleNextStory = () => {
        if (currentStory && socketClient) {
            socketClient.nextStory(roomId, currentStory.id)
        }
    }

    // Handle creating a new story
    const handleCreateStory = (title: string, description: string) => {
        if (socketClient) {
            socketClient.createStory(roomId, title, description)
        }
    }

    // Show error if connection failed
    if (error) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-card rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold text-destructive mb-4">Error</h2>
                    <p className="mb-6">{error}</p>
                    <Link
                        href="/"
                        className="block w-full text-center py-2 px-4 bg-primary text-primary-foreground rounded hover:bg-primary/90"
                    >
                        Back to Home
                    </Link>
                </div>
            </div>
        )
    }

    // Show loading state
    if (!isConnected || !room) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-xl font-semibold mb-4">Connecting to room...</h2>
                    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background p-4">
            <div className="max-w-6xl mx-auto">
                <header className="bg-card rounded-xl shadow-md p-6 mb-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-foreground">{room.name}</h1>
                            <div className="flex items-center mt-2">
                                <span className="text-muted-foreground mr-2">Room Code:</span>
                                <span className="font-mono bg-primary/10 text-primary px-3 py-1 rounded-lg">{room.roomCode}</span>
                            </div>
                        </div>
                        <div className="mt-4 md:mt-0 flex items-center gap-2">
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(room.roomCode)
                                }}
                                className="px-3 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors"
                                aria-label="Copy room code"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-5 w-5"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                    />
                                </svg>
                            </button>
                            <Link
                                href="/"
                                className="px-4 py-2 bg-destructive/10 text-destructive-foreground rounded-lg hover:bg-destructive/20 transition-colors"
                            >
                                Leave Room
                            </Link>
                            <ThemeToggle />
                        </div>
                    </div>
                </header>

                <div className="flex flex-col lg:flex-row gap-6">
                    <div className="lg:w-1/4">
                        <UserList
                            users={users}
                            votes={votes}
                            currentStoryId={currentStory?.id}
                            isRevealed={currentStory?.isRevealed || false}
                        />
                    </div>

                    <div className="lg:w-3/4">
                        <div className="bg-card rounded-lg shadow p-4 mb-6">
                            {currentStory ? (
                                <div>
                                    <h2 className="text-xl font-semibold mb-2 text-foreground">{currentStory.title}</h2>
                                    {currentStory.description && <p className="text-muted-foreground mb-4">{currentStory.description}</p>}

                                    <VotingPanel
                                        storyId={currentStory.id}
                                        userId={userId}
                                        roomId={roomId}
                                        isRevealed={currentStory.isRevealed}
                                        votes={votes}
                                        onVote={handleVote}
                                        onReveal={handleRevealVotes}
                                        onReset={handleResetVotes}
                                        onNextStory={handleNextStory}
                                        isAdmin={isAdmin}
                                    />
                                </div>
                            ) : (
                                <div className="text-center py-10">
                                    <h2 className="text-xl font-semibold mb-2 text-foreground">No Active Story</h2>
                                    <p className="text-muted-foreground">
                                        {stories.length > 0
                                            ? "Select a story from the list to start estimating"
                                            : "No stories have been added yet"}
                                    </p>
                                </div>
                            )}
                        </div>

                        <StoryList
                            stories={stories}
                            currentStoryId={currentStory?.id}
                            onStorySelect={handleStorySelect}
                            onCreateStory={handleCreateStory}
                            isAdmin={isAdmin}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}

export default RoomPage
