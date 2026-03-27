# Assighno

Assighno is a Telegram-first assignment workflow that receives student work, processes it with AI, and keeps everything visible in a polished Next.js dashboard.

## What Assighno Does

- Accepts assignment text, PDFs, and images through Telegram
- Pushes each submission into a backend processing pipeline
- Generates cleaned content and AI-assisted answers
- Shows progress, solutions, reminders, and deadlines in one dashboard

## Stack

- Frontend: Next.js App Router, TypeScript, Tailwind CSS, Firebase Email Link Authentication
- Backend: Node.js, Express, MongoDB, Telegram Bot, OCR and document parsing utilities
- AI layer: OpenRouter-based response generation

## Project Layout

- `frontend/` user-facing dashboard, login flow, profile, settings, and assignment detail pages
- `backend/` API routes, assignment services, Telegram bot flow, queue handling, and persistence logic
- `Logo/` source logo and favicon assets used for Assighno branding

## Local Setup

1. Add your environment values to `backend/.env.local`.
2. Add your Firebase and frontend values to `frontend/.env.local`.
3. Install dependencies in both apps.
4. Start the backend.
5. Start the frontend.

## Run The Backend

```bash
cd backend
npm install
npm run dev
```

## Run The Frontend

```bash
cd frontend
npm install
npm run dev
```

## Product Notes

- The dashboard auto-refreshes so incoming assignment state stays current.
- Telegram linking is handled with a short-lived `/start` code from the UI.
- Reminders stop automatically once an assignment is submitted or its deadline passes.

## Deployment

- Deploy `frontend/` to Vercel with the required `NEXT_PUBLIC_*` environment variables.
- Deploy `backend/` to a Node-compatible platform such as Cloud Run.
- Make sure MongoDB and any other backend dependencies are reachable from the deployed backend.

More setup details remain in [backend/README.md](/c:/Users/saksh/Documents/Assighno/backend/README.md) and [frontend/README.md](/c:/Users/saksh/Documents/Assighno/frontend/README.md).
