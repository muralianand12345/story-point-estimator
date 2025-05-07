story-point-estimator/
├── prisma/
│   └── schema.prisma     # Database schema
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── socket/
│   │   │   │   └── route.ts    # WebSocket API handler
│   │   │   ├── room/
│   │   │   │   ├── create/
│   │   │   │   │   └── route.ts    # API for creating rooms
│   │   │   │   ├── join/
│   │   │   │   │   └── route.ts    # API for joining rooms
│   │   │   │   └── invite/
│   │   │   │       └── route.ts    # API for inviting users
│   │   ├── room/
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx    # Room page
│   │   │   ├── create/
│   │   │   │   └── page.tsx    # Create room page
│   │   │   └── join/
│   │   │       └── page.tsx    # Join room page
│   │   ├── page.tsx    # Home page
│   │   └── layout.tsx  # Root layout
│   ├── components/
│   │   ├── EstimationCard.tsx  # Card component for estimation
│   │   ├── RoomCreation.tsx    # Room creation form
│   │   ├── RoomJoin.tsx        # Room join form
│   │   ├── StoryList.tsx       # List of stories
│   │   ├── UserList.tsx        # List of users in room
│   │   └── VotingPanel.tsx     # Panel for voting
│   ├── lib/
│   │   ├── db.ts               # Database client
│   │   ├── socket.ts           # WebSocket client
│   │   ├── socketServer.ts     # WebSocket server
│   │   └── types.ts            # TypeScript types
│   └── styles/
│       └── globals.css         # Global styles
├── .env                # Environment variables
├── package.json
└── tsconfig.json
