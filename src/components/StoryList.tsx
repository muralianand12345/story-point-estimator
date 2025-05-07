import React, { useState } from 'react';
import { Story } from '@/lib/types';

interface StoryListProps {
    stories: Story[];
    currentStoryId?: string;
    onStorySelect: (storyId: string) => void;
    onCreateStory: (title: string, description: string) => void;
    isAdmin: boolean;
}

const StoryList: React.FC<StoryListProps> = ({
    stories,
    currentStoryId,
    onStorySelect,
    onCreateStory,
    isAdmin,
}) => {
    const [showNewStoryForm, setShowNewStoryForm] = useState(false);
    const [newStoryTitle, setNewStoryTitle] = useState('');
    const [newStoryDescription, setNewStoryDescription] = useState('');

    const handleCreateStory = (e: React.FormEvent) => {
        e.preventDefault();
        if (newStoryTitle.trim()) {
            onCreateStory(newStoryTitle.trim(), newStoryDescription.trim());
            setNewStoryTitle('');
            setNewStoryDescription('');
            setShowNewStoryForm(false);
        }
    };

    const activeStories = stories.filter(story => story.isActive);
    const completedStories = stories.filter(story => !story.isActive);

    return (
        <div className="bg-white rounded-lg shadow p-4">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Stories</h2>
                {isAdmin && (
                    <button
                        className="text-blue-500 hover:text-blue-700"
                        onClick={() => setShowNewStoryForm(!showNewStoryForm)}
                    >
                        {showNewStoryForm ? 'Cancel' : '+ Add Story'}
                    </button>
                )}
            </div>

            {showNewStoryForm && (
                <form onSubmit={handleCreateStory} className="mb-6 bg-gray-50 p-4 rounded">
                    <div className="mb-3">
                        <label htmlFor="storyTitle" className="block text-sm font-medium text-gray-700 mb-1">
                            Title
                        </label>
                        <input
                            type="text"
                            id="storyTitle"
                            value={newStoryTitle}
                            onChange={(e) => setNewStoryTitle(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter story title"
                            required
                        />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="storyDescription" className="block text-sm font-medium text-gray-700 mb-1">
                            Description (optional)
                        </label>
                        <textarea
                            id="storyDescription"
                            value={newStoryDescription}
                            onChange={(e) => setNewStoryDescription(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter story description"
                            rows={3}
                        />
                    </div>
                    <button
                        type="submit"
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                        Create Story
                    </button>
                </form>
            )}

            {activeStories.length === 0 && completedStories.length === 0 && !showNewStoryForm && (
                <p className="text-gray-500 py-4 text-center">
                    No stories yet. {isAdmin ? 'Add a story to get started.' : 'Waiting for admin to add stories.'}
                </p>
            )}

            {activeStories.length > 0 && (
                <div className="mb-4">
                    <h3 className="text-md font-medium mb-2">Active</h3>
                    <ul className="space-y-2">
                        {activeStories.map((story) => (
                            <li
                                key={story.id}
                                className={`
                  p-3 rounded cursor-pointer
                  ${currentStoryId === story.id ? 'bg-blue-50 border-l-4 border-blue-500' : 'hover:bg-gray-50'}
                `}
                                onClick={() => onStorySelect(story.id)}
                            >
                                <div className="font-medium">{story.title}</div>
                                {story.description && (
                                    <div className="text-sm text-gray-600 mt-1">{story.description}</div>
                                )}
                                {story.isRevealed && (
                                    <div className="mt-1">
                                        <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
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
                    <h3 className="text-md font-medium mb-2">Completed</h3>
                    <ul className="space-y-2">
                        {completedStories.map((story) => (
                            <li
                                key={story.id}
                                className="p-3 bg-gray-50 rounded"
                            >
                                <div className="font-medium">{story.title}</div>
                                {story.description && (
                                    <div className="text-sm text-gray-600 mt-1">{story.description}</div>
                                )}
                                <div className="mt-1">
                                    <span className="text-xs bg-gray-200 text-gray-800 px-2 py-0.5 rounded">
                                        Completed
                                    </span>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default StoryList;