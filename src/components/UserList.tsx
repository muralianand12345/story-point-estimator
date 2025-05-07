import type React from "react"
import type { RoomUser, Vote } from "@/lib/types"

interface UserListProps {
    users: RoomUser[]
    votes: Vote[]
    currentStoryId?: string
    isRevealed: boolean
}

const UserList: React.FC<UserListProps> = ({ users, votes, currentStoryId, isRevealed }) => {
    return (
        <div className="bg-card rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-foreground mb-4">Participants ({users.length})</h2>

            <ul className="space-y-3">
                {users.map((roomUser) => {
                    const hasVoted = currentStoryId
                        ? votes.some((vote) => vote.userId === roomUser.userId && vote.storyId === currentStoryId)
                        : false

                    const userVote = votes.find((vote) => vote.userId === roomUser.userId && vote.storyId === currentStoryId)

                    return (
                        <li
                            key={roomUser.userId}
                            className="flex items-center justify-between p-3 rounded-lg hover:bg-accent transition-colors"
                        >
                            <div className="flex items-center">
                                <div className="w-10 h-10 bg-gradient-to-br from-primary/70 to-primary text-primary-foreground rounded-full flex items-center justify-center font-bold mr-3 shadow-sm">
                                    {roomUser.user.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <span className="font-medium text-foreground">{roomUser.user.name}</span>
                                    {roomUser.isAdmin && (
                                        <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">Admin</span>
                                    )}
                                </div>
                            </div>

                            <div>
                                {hasVoted ? (
                                    isRevealed ? (
                                        <span className="text-green-600 dark:text-green-400 font-medium px-3 py-1 bg-green-100 dark:bg-green-900/30 rounded-full">
                                            {userVote?.value}
                                        </span>
                                    ) : (
                                        <span className="text-green-600 dark:text-green-400 px-3 py-1 bg-green-100 dark:bg-green-900/30 rounded-full">
                                            Voted
                                        </span>
                                    )
                                ) : (
                                    <span className="text-muted-foreground px-3 py-1 bg-muted rounded-full">Not voted</span>
                                )}
                            </div>
                        </li>
                    )
                })}
            </ul>
        </div>
    )
}

export default UserList
