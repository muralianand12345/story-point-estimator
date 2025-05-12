# Story Point Estimator - Deno WebSocket Server

This is the WebSocket server component for the Story Point Estimator application, built with Deno.

## Features

- Real-time WebSocket server for handling room-based estimation sessions
- User presence and voting state management
- PostgreSQL database integration
- Room management with host capabilities (kick users, reveal votes, etc.)

## Prerequisites

- [Deno](https://deno.land/) v1.34.0 or higher
- PostgreSQL database

## Getting Started

1. Clone the repository
2. Copy `.env.example` to `.env` and update the environment variables
3. Start the server:

```bash
# Development mode with auto-reload
deno task dev

# Production mode
deno task start
```

## Environment Variables

- `PORT`: Server port (default: 8000)
- `HOST`: Server host (default: 0.0.0.0)
- `ALLOWED_ORIGINS`: CORS allowed origins (default: *)
- `POSTGRES_USER`: PostgreSQL database user
- `POSTGRES_PASSWORD`: PostgreSQL database password
- `POSTGRES_DB`: PostgreSQL database name
- `POSTGRES_HOST`: PostgreSQL database host
- `POSTGRES_PORT`: PostgreSQL database port (default: 5432)
- `POSTGRES_SSL`: Use SSL for PostgreSQL connection (true/false)

## Project Structure

- `src/index.ts`: Main entry point
- `src/db/`: Database-related code
- `src/handlers/`: WebSocket event handlers
- `src/types/`: Type definitions

## WebSocket API

The WebSocket server accepts JSON messages in the following format:

```json
{
  "event": "EVENT_TYPE",
  "userId": "user-id",
  "roomId": "room-id",
  "payload": {}
}
```

### Connection

To establish a WebSocket connection:

```javascript
const socket = new WebSocket('ws://localhost:8000/ws');

// Initialize connection with user and room IDs
socket.onopen = () => {
  socket.send(JSON.stringify({
    event: 'init',
    userId: 'user-id',
    roomId: 'room-id',
    payload: null
  }));
};
```

### Events

The server handles the following events:

- `USER_JOINED`: New user joined a room
- `USER_LEFT`: User left the room
- `HOST_CHANGED`: Room host has changed
- `KICKED`: User was kicked from the room
- `KICK_USER`: Request to kick a user
- `LEAVE_ROOM`: User leaving a room
- `SUBMIT_VOTE`: User submitting a vote
- `REVEAL_VOTES`: Request to reveal all votes
- `RESET_VOTES`: Request to reset all votes
- `VOTES_UPDATED`: Votes have been updated
- `ISSUE_UPDATED`: Current issue has been updated

## Deployment

This server can be deployed on Deno Deploy or any other Deno-compatible hosting platform.

To deploy to Deno Deploy:

1. Push the code to a GitHub repository
2. Create a new project on Deno Deploy
3. Connect the GitHub repository
4. Configure the environment variables