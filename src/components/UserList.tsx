import React from 'react';
import { RoomUser, Vote } from '@/lib/types';

interface UserListProps {
    users: RoomUser[];
    votes: Vote[];
    currentStoryId?: string;
    isRevealed: boolean;
}

const UserList: React.FC<UserListProps> = ({
    users,
    votes,
    currentStoryId,
    isRevealed,
}) => {
    return (
        <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-lg font-semibold mb-4">Participants ({users.length})</h2>

            <ul className="space-y-2">
                {users.map((roomUser) => {
                    const hasVoted = currentStoryId
                        ? votes.some(
                            (vote) =>
                                vote.userId === roomUser.userId && vote.storyId === currentStoryId
                        )
                        : false;

                    const userVote = votes.find(
                        (vote) => vote.userId === roomUser.userId && vote.storyId === currentStoryId
                    );

                    return (
                        <li
                            key={roomUser.userId}
                            className="flex items-center justify-between py-2 border-b last:border-b-0"
                        >
                            <div className="flex items-center">
                                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                                    {roomUser.user.name.charAt(0).toUpperCase()}
                                </div>
                                <span>
                                    {roomUser.user.name}
                                    {roomUser.isAdmin && (
                                        <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                                            Admin
                                        </span>
                                    )}
                                </span>
                            </div>

                            <div>
                                {hasVoted ? (
                                    isRevealed ? (
                                        <span className="text-green-600 font-medium">{userVote?.value}</span>
                                    ) : (
                                        <span className="text-green-600">Voted</span>
                                    )
                                ) : (
                                    <span className="text-gray-400">Not voted</span>
                                )}
                            </div>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
};

export default UserList;