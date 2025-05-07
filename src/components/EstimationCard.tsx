"use client"

import type React from "react"

interface EstimationCardProps {
    value: string
    selected: boolean
    onClick: () => void
    revealed: boolean
    count?: number
}

const EstimationCard: React.FC<EstimationCardProps> = ({ value, selected, onClick, revealed, count }) => {
    return (
        <div
            className={`
        w-20 h-28 rounded-xl flex flex-col items-center justify-center
        border-2 shadow-md cursor-pointer transition-all transform 
        ${selected ? "border-primary bg-primary/10 scale-110" : "border-border hover:border-primary/50"}
        ${revealed ? "bg-card" : "bg-card hover:bg-accent"}
      `}
            onClick={onClick}
        >
            <div className={`text-2xl font-bold ${selected ? "text-primary" : "text-foreground"}`}>{value}</div>
            {revealed && count !== undefined && (
                <div
                    className={`mt-2 px-2 py-1 rounded-full ${count > 0
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-muted text-muted-foreground"
                        }`}
                >
                    {count} {count === 1 ? "vote" : "votes"}
                </div>
            )}
        </div>
    )
}

export default EstimationCard
