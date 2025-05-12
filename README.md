# Story Point Estimator

A collaborative tool for agile story point estimation, built with Next.js and Material UI.

## Project Structure

This project consists of two separate components:

1. **Next.js Frontend**: Handles the UI, user interactions, and REST API endpoints
2. **Deno WebSocket Server**: Manages real-time communication between users (in the `server` directory)

## Prerequisites

- Node.js 18+
- Deno 1.34+
- PostgreSQL database

## Getting Started

### Setting up the Next.js Frontend

1. Install dependencies:

```bash
npm install
```

2. Copy `.env.example` to `.env.local` and update the environment variables:

```bash
cp .env.example .env.local
```

3. Generate Prisma client:

```bash
npm run prisma:generate
```

4. Run migrations:

```bash
npm run prisma:migrate
```

5. Start the development server:

```bash
npm run dev
```

The frontend will be available at http://localhost:3000

### Setting up the Deno WebSocket Server

1. Navigate to the server directory:

```bash
cd server
```

2. Copy `.env.example` to `.env` and update the environment variables:

```bash
cp .env.example .env
```

3. Start the Deno server:

```bash
deno task dev
```

The WebSocket server will be available at ws://localhost:8000/ws

## Production Deployment

### NextJS Frontend (Vercel)

1. Push your code to a GitHub repository
2. Create a new project on Vercel
3. Connect your GitHub repository
4. Configure environment variables
5. Deploy

### Deno WebSocket Server (Deno Deploy)

1. Push your code to a GitHub repository
2. Create a new project on Deno Deploy
3. Connect your GitHub repository
4. Configure environment variables
5. Deploy

## Environment Variables

### NextJS Frontend

- `DATABASE_URL`: PostgreSQL connection string
- `PORT`: Server port (default: 3000)
- `NEXT_PUBLIC_WEBSOCKET_URL`: WebSocket server URL

### Deno WebSocket Server

- `PORT`: Server port (default: 8000)
- `HOST`: Server host (default: 0.0.0.0)
- `ALLOWED_ORIGINS`: CORS allowed origins (default: *)
- `POSTGRES_USER`: PostgreSQL database user
- `POSTGRES_PASSWORD`: PostgreSQL database password
- `POSTGRES_DB`: PostgreSQL database name
- `POSTGRES_HOST`: PostgreSQL database host
- `POSTGRES_PORT`: PostgreSQL database port (default: 5432)
- `POSTGRES_SSL`: Use SSL for PostgreSQL connection (true/false)

## Features

- Create and join estimation rooms
- Real-time voting and result visualization
- Host controls (kick users, reveal/reset votes)
- Responsive design with light/dark mode