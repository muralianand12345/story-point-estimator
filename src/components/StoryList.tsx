"use client"

import type React from "react"
import { useState } from "react"
import type { Story } from "@/lib/types"

interface StoryListProps {
    stories: Story[]
    currentStoryId?: string
    onStorySelect: (storyId: string) => void
    onCreateStory: (title: string, description: string) => void
    isAdmin: boolean
}

const StoryList: React.FC<StoryListProps> = ({ stories, currentStoryId, onStorySelect, onCreateStory, isAdmin }) => {
    const [showNewStoryForm, setShowNewStoryForm] = useState(false)
    const [newStoryTitle, setNewStoryTitle] = useState("")
    const [newStoryDescription, setNewStoryDescription] = useState("")

    const handleCreateStory = (e: React.FormEvent) => {
        e.preventDefault()
        if (newStoryTitle.trim()) {
            onCreateStory(newStoryTitle.trim(), newStoryDescription.trim())
            setNewStoryTitle("")
            setNewStoryDescription("")
            setShowNewStoryForm(false)
        }
    }

    const activeStories = stories.filter((story) => story.isActive)
    const completedStories = stories.filter((story) => !story.isActive)

    return (
        <div className="bg-card rounded-xl shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-foreground">Stories</h2>
                {isAdmin && (
                    <button
                        className="text-primary hover:text-primary/90 flex items-center"
                        onClick={() => setShowNewStoryForm(!showNewStoryForm)}
                    >
                        {showNewStoryForm ? (
                            <>
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-5 w-5 mr-1"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                Cancel
                            </>
                        ) : (
                            <>
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-5 w-5 mr-1"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Add Story
                            </>
                        )}
                    </button>
                )}
            </div>

            {showNewStoryForm && (
                <form onSubmit={handleCreateStory} className="mb-6 bg-muted p-5 rounded-xl shadow-inner">
                    <div className="mb-4">
                        <label htmlFor="storyTitle" className="block text-sm font-medium text-foreground mb-2">
                            Title
                        </label>
                        <input
                            type="text"
                            id="storyTitle"
                            value={newStoryTitle}
                            onChange={(e) => setNewStoryTitle(e.target.value)}
                            className="input"
                            placeholder="Enter story title"
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="storyDescription" className="block text-sm font-medium text-foreground mb-2">
                            Description (optional)
                        </label>
                        <textarea
                            id="storyDescription"
                            value={newStoryDescription}
                            onChange={(e) => setNewStoryDescription(e.target.value)}
                            className="input"
                            placeholder="Enter story description"
                            rows={3}
                        />
                    </div>
                    <button
                        type="submit"
                        className="px-5 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors shadow-md"
                    >
                        Create Story
                    </button>
                </form>
            )}

            {activeStories.length === 0 && completedStories.length === 0 && !showNewStoryForm && (
                <div className="py-10 text-center">
                    <div className="mx-auto w-16 h-16 bg-muted flex items-center justify-center rounded-full mb-4">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-8 w-8 text-muted-foreground"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                        </svg>
                    </div>
                    <p className="text-muted-foreground">
                        No stories yet. {isAdmin ? "Add a story to get started." : "Waiting for admin to add stories."}
                    </p>
                </div>
            )}

            {activeStories.length > 0 && (
                <div className="mb-6">
                    <h3 className="text-md font-semibold text-primary mb-3 pb-2 border-b">Active Stories</h3>
                    <ul className="space-y-3">
                        {activeStories.map((story) => (
                            <li
                                key={story.id}
                                className={`
                  p-4 rounded-lg cursor-pointer transition-all
                  ${currentStoryId === story.id
                                        ? "bg-primary/10 border-l-4 border-primary shadow-md"
                                        : "hover:bg-accent border-l-4 border-transparent"
                                    }
                `}
                                onClick={() => onStorySelect(story.id)}
                            >
                                <div className="font-medium text-foreground">{story.title}</div>
                                {story.description && <div className="text-sm text-muted-foreground mt-2">{story.description}</div>}
                                {story.isRevealed && (
                                    <div className="mt-2">
                                        <span className="text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 px-2 py-1 rounded-full">
                                            Revealed
                                        </span>
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {completedStories.length > 0 && (
                <div>
                    <h3 className="text-md font-semibold text-muted-foreground mb-3 pb-2 border-b">Completed Stories</h3>
                    <ul className="space-y-3">
                        {completedStories.map((story) => (
                            <li key={story.id} className="p-4 bg-muted rounded-lg opacity-80">
                                <div className="font-medium text-foreground">{story.title}</div>
                                {story.description && <div className="text-sm text-muted-foreground mt-2">{story.description}</div>}
                                <div className="mt-2">
                                    <span className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded-full">
                                        Completed
                                    </span>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    )
}

export default StoryList
