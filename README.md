# Collab Notes

A real-time classroom collaboration application built with Next.js, Firebase Auth, MongoDB, and TypeScript. This application enables teachers and students to collaborate in real-time during classroom sessions.

## Features

- **Real-time Collaboration**: Teachers can create sessions and share content that updates live for all connected students
- **Teacher Dashboard**: Create sessions, manage student access codes, and share one-off content
- **Student Dashboard**: Join live sessions or receive shared content using codes
- **Chat System**: Real-time messaging within sessions with visual distinction for teacher messages
- **Point System**: Reward-based system where students can award points to content senders
- **Leaderboard**: Track top-performing teachers and students based on collaboration points

## Technology Stack

- **Framework**: Next.js 14+ with App Router
- **Language**: TypeScript
- **UI Components**: shadcn/ui
- **Styling**: Tailwind CSS
- **Backend**: MongoDB (database) + Firebase Authentication (teachers)
- **Real-time**: Polling mechanism via Server Actions

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Firebase project set up
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd collab-notes
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
   - Copy `.env.example` to `.env.local`
   - Fill in your Firebase and MongoDB configuration values:
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   
   # MongoDB
   MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/?retryWrites=true&w=majority
   MONGODB_DB=collab-notes
   ```

4. Configure Firebase:
   - Enable Google Authentication in Firebase Console
   
5. Provision MongoDB:
   - Create a MongoDB database (Atlas or self-hosted)
   - Set `MONGODB_URI` and `MONGODB_DB` in `.env.local`

6. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
collab-notes/
├── app/
│   ├── actions.ts              # Server Actions for all backend logic
│   ├── page.tsx               # Login page
│   ├── collab/
│   │   └── page.tsx           # Teacher dashboard
│   ├── join/
│   │   └── page.tsx           # Student dashboard
│   ├── session/
│   │   └── [id]/
│   │       └── page.tsx       # Real-time collaboration session
│   ├── leaderboard/
│   │   └── page.tsx           # Leaderboard page
│   ├── layout.tsx             # Root layout
│   └── globals.css            # Global styles and theme
├── components/
│   ├── header.tsx             # App header component
│   ├── manage-access-code.tsx # Access code management
│   ├── send-content-form.tsx  # Content sharing form
│   ├── content-display.tsx    # Content display component
│   ├── chat-box.tsx           # Chat component
│   └── ui/                    # shadcn/ui components
├── firebase/
│   ├── config.ts              # Firebase configuration (client)
│   └── index.ts               # Firebase Auth initialization (no Firestore)
└── lib/
    ├── utils.ts               # Utility functions
    └── mongo.ts               # MongoDB client helper
```

## Usage

### For Teachers

1. Sign in with Google on the login page
2. Go to the Teacher Dashboard (`/collab`)
3. Create a new session or manage the student access code
4. Share the session ID with students
5. Edit content in real-time - students will see updates automatically
6. Use the "Share Content" tab to share one-off files or text

### For Students

1. Enter your name and the access code provided by your teacher
2. Go to the Student Dashboard (`/join`)
3. Enter a session ID to join a live session, or use a share code to receive content
4. View shared content and participate in chat
5. Award points to content senders

## MongoDB Collections

- `users` (`_id` is user id; `role` is `teacher`|`student`)
- `content` (`_id` is session/content id; shared content documents)
- `messages` (chat messages with `sessionId` foreign key)

## Development

- Run the development server: `npm run dev`
- Build for production: `npm run build`
- Start production server: `npm start`
- Lint code: `npm run lint`

## Notes

- The application uses polling (setInterval) for real-time updates instead of WebSockets
- Student authentication uses access codes (stored in `.access_code.txt`)
- Session state is managed client-side using sessionStorage
- All server-side logic is handled via Next.js Server Actions

## License

MIT
