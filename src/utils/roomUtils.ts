// Generate a random room code
export const generateRoomCode = (): string => {
    // Generate a 6-character alphanumeric code
    const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed similar looking characters
    let result = '';

    for (let i = 0; i < 6; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        result += characters.charAt(randomIndex);
    }

    return result;
};

// Format votes for display
export const calculateVoteStats = (votes: (string | null)[]) => {
    // Filter out null votes
    const validVotes = votes.filter(vote => vote !== null) as string[];

    if (validVotes.length === 0) {
        return {
            average: 0,
            mode: null,
            min: 0,
            max: 0,
            distribution: {},
        };
    }

    // Convert numeric votes to numbers for calculations
    const numericVotes = validVotes
        .filter(vote => vote !== '?' && !isNaN(Number(vote)))
        .map(vote => Number(vote));

    // Calculate distribution
    const distribution: Record<string, number> = {};
    validVotes.forEach(vote => {
        distribution[vote] = (distribution[vote] || 0) + 1;
    });

    // Find the mode (most common vote)
    let mode = null;
    let maxCount = 0;

    for (const [vote, count] of Object.entries(distribution)) {
        if (count > maxCount) {
            maxCount = count;
            mode = vote;
        }
    }

    return {
        average: numericVotes.length > 0
            ? Math.round((numericVotes.reduce((a, b) => a + b, 0) / numericVotes.length) * 10) / 10
            : 0,
        mode,
        min: numericVotes.length > 0 ? Math.min(...numericVotes) : 0,
        max: numericVotes.length > 0 ? Math.max(...numericVotes) : 0,
        distribution,
    };
};