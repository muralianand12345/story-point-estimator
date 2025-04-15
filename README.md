# Story Point Estimator

A simple, real-time story point estimation tool for agile teams. Built with Next.js and TypeScript, this application allows teams to estimate story points collaboratively without needing a backend or database.

## Features

- **Create Rooms**: Hosts can create estimation rooms with custom names and descriptions
- **Join Rooms**: Team members can join rooms using a 6-character room code
- **Vote on Story Points**: Participants can vote using the Fibonacci sequence (0, 1, 2, 3, 5, 8, 13, 21)
- **Reveal Results**: Hosts can reveal votes when everyone has submitted their estimates
- **Statistics**: View average, consensus (mode), min, and max values of the team's estimates
- **Visualization**: See a distribution chart of the team's votes
- **Persistence**: Room and participant data are stored in localStorage

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository or download the source code

2. Install the dependencies:
```bash
npm install
# or
yarn install
```

3. Run the development server:
```bash
npm run dev
# or
yarn dev
```

4. Open your browser and navigate to `http://localhost:3000`

## How to Use

### Creating a Room

1. On the home page, fill in your name, room name, and optional description
2. Click "Create Room"
3. You'll be taken to the room page where you can share the room code with your team

### Joining a Room

1. Either enter the 6-character room code on the home page, or use a direct link shared by the host
2. Enter your name
3. Click "Join Room"

### Estimating Story Points

1. Select a story point value from the available options
2. Wait for all participants to vote
3. If you're the host, click "Reveal Votes" when everyone has voted
4. Review the results and statistics
5. Click "Reset Voting" to start a new round

## Technology Stack

- **Next.js**: React framework with server-side rendering
- **TypeScript**: Type-safe JavaScript
- **Tailwind CSS**: Utility-first CSS framework
- **localStorage**: Client-side storage for room and participant data

## Limitations

Since this application uses localStorage for data persistence:

- All data is stored in the user's browser
- If a host closes their browser, the room will still exist but might become inaccessible
- There's no real-time communication between users - participants need to refresh their browser to see updates

## License

This project is licensed under the MIT License - see the LICENSE file for details.