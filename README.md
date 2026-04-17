# CodeMiles 🚀
Mobile-first AI-powered Git assistant. Edit your codebase without ever touching the terminal or reviewing files manually.
Powered by Groq's API (`llama-3.3-70b-versatile`) and GitHub REST APIs.

## Features
- **Zero-touch Workflow**: Log in with GitHub, paste your repo URL, completely bypass the CLI.
- **AI File Discovery**: Describe what you want in plain English. CodeMiles reads the entire repo and decides what needs editing.
- **Line-by-line Diff**: A clean, minimalistic red/green diff viewer for reviewing modifications before they are pushed.
- **Push Direct to Git**: Auto-generates a clean commit message and updates files using the GitHub Contents API directly on your repository.

## Architecture
- **Frontend**: React (Vite), Framer Motion, Lucide React, Diff
- **Backend**: Node.js, Express, express-session, express-rate-limit
- **Auth**: GitHub OAuth App
- **LLM**: Groq LLaMA 3.3 70B

## Setup for Public Deployment
You can deploy the frontend to Vercel and the backend to Render/Railway.

### 1. Register GitHub OAuth App
Go to your GitHub Developer Settings -> OAuth Apps -> New OAuth App
- **Homepage URL**: Your frontend's deployed URL (e.g., `https://codemiles.vercel.app`)
- **Authorization callback URL**: Your backend's deployed URL + `/auth/github/callback` (e.g., `https://codemiles-4.onrender.com/auth/github/callback`)
- Note down your `Client ID` and generate a `Client Secret`.

### 2. Backend Deployment Environment Variables (Render)
Set the following env variables on your deployment host (e.g. Render). **Make sure your Root Directory is set to `backend`**.
- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`
- `GROQ_API_KEY`
- `FRONTEND_URL` (e.g., `https://codemiles.vercel.app` - no trailing slash)
- `BACKEND_URL` (e.g., `https://codemiles-4.onrender.com` - no trailing slash)
- `SESSION_SECRET` (Use a long random string)
- `NODE_ENV=production`

### 3. Frontend Deployment Environment Variables (Vercel)
Set the following env variables in your frontend host (e.g. Vercel). **Make sure your Root Directory is set to `frontend`**.
- `VITE_API_URL` (e.g., `https://codemiles-4.onrender.com` - no trailing slash)

### Local Development
1. Clone this repository.
2. In `backend/`, copy `.env.example` to `.env` and fill in local values. Run `npm install` and then `npm start`.
3. In `frontend/`, copy `.env.example` to `.env` and fill in local values. Run `npm install` and then `npm run dev`.

**Note:** The backend uses `trust proxy` for secure cross-site cookies during production mapping. You must leave `COOKIE_DOMAIN` empty unless using a shared parent domain.
