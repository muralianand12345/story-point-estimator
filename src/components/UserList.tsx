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
        <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-blue-900 mb-4">
                Participants ({users.length})
            </h2>

            <ul className="space-y-3">
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
                            className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <div className="flex items-center">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 text-white rounded-full flex items-center justify-center font-bold mr-3 shadow-sm">
                                    {roomUser.user.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <span className="font-medium text-gray-800">
                                        {roomUser.user.name}
                                    </span>
                                    {roomUser.isAdmin && (
                                        <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                            Admin
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div>
                                {hasVoted ? (
                                    isRevealed ? (
                                        <span className="text-green-600 font-medium px-3 py-1 bg-green-50 rounded-full">
                                            {userVote?.value}
                                        </span>
                                    ) : (
                                        <span className="text-green-600 px-3 py-1 bg-green-50 rounded-full">
                                            Voted
                                        </span>
                                    )
                                ) : (
                                    <span className="text-gray-400 px-3 py-1 bg-gray-50 rounded-full">
                                        Not voted
                                    </span>
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