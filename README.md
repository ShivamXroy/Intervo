# Intervo

> A real-time coding interview platform where developers can solve problems, run code, video call, and chat inside one focused workspace.

![Intervo Hero](frontend/public/hero.png)

![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=111)
![Vite](https://img.shields.io/badge/Vite-7-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Express](https://img.shields.io/badge/Express-5-111111?style=for-the-badge&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Clerk](https://img.shields.io/badge/Auth-Clerk-6C47FF?style=for-the-badge&logo=clerk&logoColor=white)
![Stream](https://img.shields.io/badge/Video_Chat-Stream-005FFF?style=for-the-badge&logo=getstream&logoColor=white)

## The vibe

Intervo is built for live coding practice without the tab chaos.

No jumping between a meeting app, a notes app, a coding website, and a chat window. Intervo puts the interview room, problem statement, code editor, output panel, video call, and chat in one place.

It is made for:

- 👨‍💻 mock coding interviews
- 🤝 pair programming practice
- 📚 DSA problem solving
- 🎥 live technical sessions
- ⚡ focused interview prep

## What it does

| Feature | What you get |
|---|---|
| 🔐 Authentication | Sign in securely with Clerk |
| 🧭 Dashboard | See active sessions, recent sessions, and stats |
| 🏁 Create sessions | Start a coding room with a selected problem |
| 🚪 Join sessions | Enter open live rooms from the dashboard |
| 🎥 Video calls | Talk face-to-face inside the session |
| 💬 Session chat | Message during the interview |
| 🧠 Practice problems | Solve curated coding questions |
| 📝 Code editor | Write code in a Monaco-powered editor |
| ▶️ Code runner | Execute code using the Piston API |
| 🌍 Multi-language support | JavaScript, Python, and Java |
| 📌 Session history | View completed sessions in recent activity |

## How the app flows

```mermaid
flowchart LR
    A["Sign in"] --> B["Open dashboard"]
    B --> C["Create or join session"]
    C --> D["Read problem"]
    D --> E["Write code"]
    E --> F["Run code"]
    C --> G["Video call"]
    C --> H["Chat"]
    F --> I["End session"]
```

## Architecture

```mermaid
flowchart TD
    User["User"] --> Frontend["React + Vite frontend"]
    Frontend --> Clerk["Clerk auth"]
    Frontend --> Backend["Express API"]
    Frontend --> Piston["Piston code execution"]
    Frontend --> StreamVideo["Stream video"]
    Frontend --> StreamChat["Stream chat"]

    Backend --> MongoDB["MongoDB"]
    Backend --> Clerk
    Backend --> StreamSDK["Stream Node SDK"]
    Backend --> Inngest["Inngest webhooks"]

    Inngest --> MongoDB
    StreamSDK --> StreamVideo
    StreamSDK --> StreamChat
```

## Session lifecycle

```mermaid
stateDiagram-v2
    [*] --> Created
    Created --> Active: host starts room
    Active --> Joined: participant joins
    Joined --> Live: video and chat active
    Live --> Completed: host ends session
    Completed --> RecentSessions
    RecentSessions --> [*]
```

## Tech stack

### Frontend

- ⚛️ React
- ⚡ Vite
- 🎨 Tailwind CSS
- 🌼 DaisyUI
- 🧭 React Router
- 🔄 TanStack Query
- 📝 Monaco Editor
- 🔐 Clerk React
- 🎥 Stream Video React SDK
- 💬 Stream Chat React
- 📡 Axios

### Backend

- 🟢 Node.js
- 🚀 Express
- 🍃 MongoDB
- 🧬 Mongoose
- 🔐 Clerk Express
- 🌊 Stream Node SDK
- ⚡ Inngest
- 🌍 CORS
- 🔒 Dotenv

### External services

| Service | Purpose |
|---|---|
| Clerk | Authentication |
| MongoDB | Database |
| Stream | Video calls and chat |
| Piston | Code execution |
| Inngest | Clerk user webhook handling |

## Project structure

```bash
Intervo/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── lib/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   └── server.js
│   └── package.json
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── data/
│   │   ├── hooks/
│   │   ├── lib/
│   │   ├── pages/
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
│
└── README.md
```

## Environment variables

Create `backend/.env`:

```env
PORT=5001
NODE_ENV=development
CLIENT_URL=http://localhost:5173
DB_URL=your_mongodb_connection_string

CLERK_SECRET_KEY=your_clerk_secret_key
CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key

STREAM_API_KEY=your_stream_api_key
STREAM_API_SECRET=your_stream_api_secret

INNGEST_EVENT_KEY=your_inngest_event_key
INNGEST_SIGNING_KEY=your_inngest_signing_key
```

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:5001/api
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
VITE_STREAM_API_KEY=your_stream_api_key
```

Do not push real `.env` values to GitHub.

## Run locally

Clone the repo:

```bash
git clone https://github.com/your-username/Intervo.git
cd Intervo
```

Install backend dependencies:

```bash
cd backend
npm install
```

Install frontend dependencies:

```bash
cd ../frontend
npm install
```

Start the backend:

```bash
cd backend
npm run dev
```

Start the frontend:

```bash
cd frontend
npm run dev
```

Open:

```text
http://localhost:5173
```

## API routes

| Method | Route | Description |
|---|---|---|
| GET | `/health` | Check backend status |
| POST | `/api/sessions` | Create a coding session |
| GET | `/api/sessions/active` | Get active sessions |
| GET | `/api/sessions/my-recent` | Get recent completed sessions |
| GET | `/api/sessions/:id` | Get one session |
| POST | `/api/sessions/:id/join` | Join a session |
| POST | `/api/sessions/:id/end` | End a session |
| GET | `/api/chat/token` | Get Stream token |

## Main screens

- 🏠 Landing page
- 📊 Dashboard
- 📚 Problems page
- 🧑‍💻 Problem workspace
- 🎥 Live session room
- 💬 Chat panel
- ▶️ Output panel

## Why Intervo hits different

Intervo keeps the full interview flow in one place:

- problem statement on one side
- code editor and output ready to go
- video call for real conversation
- chat for quick messages
- dashboard to jump into sessions fast

Simple, focused, and actually useful for practice.
