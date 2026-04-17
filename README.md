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
We have set this repository up as a unified **Monolithic Deployment**. This means the backend statically serves the built frontend using Express, which prevents any cross-domain or Safari cookie issues for your GitHub OAuth!

You only need to deploy this single repository once using a service like **Render**, **Railway**, or **Heroku**.

### 1. Register GitHub OAuth App
Go to your GitHub Developer Settings -> OAuth Apps -> New OAuth App
- **Homepage URL**: Your new deployed URL (e.g., `https://codemiles-app.onrender.com`)
- **Authorization callback URL**: Your deployed URL + `/auth/github/callback` (e.g., `https://codemiles-app.onrender.com/auth/github/callback`)
- Note down your `Client ID` and generate a `Client Secret`.

### 2. Deploy Platform Settings (Render / Railway)
Connect this repository to your hosting service. Since we added a root `package.json`, they will auto-detect the build scripts!
- **Build Command**: `npm install && npm run build` (or they might use your `postinstall` automatically)
- **Start Command**: `npm start`
- **Root Directory**: Leave blank (root of project)

### 3. Environment Variables
Add these to your deployment service:
- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`
- `GROQ_API_KEY`
- `FRONTEND_URL` (Your URL again, e.g. `https://codemiles-app.onrender.com`)
- `BACKEND_URL` (Same exact URL as frontend, e.g. `https://codemiles-app.onrender.com`)
- `SESSION_SECRET` (Use a long random string)
- `NODE_ENV=production`

*(You no longer need to worry about Vercel, CORS origins, or custom domains since they are unified into one URL!)*

### Local Development
1. Clone this repository.
2. In `backend/`, copy `.env.example` to `.env` and fill in local values. Run `npm install` and then `npm start`.
3. In `frontend/`, copy `.env.example` to `.env` and fill in local values. Run `npm install` and then `npm run dev`.

**Note:** The backend uses `trust proxy` for secure cross-site cookies during production mapping. You must leave `COOKIE_DOMAIN` empty unless using a shared parent domain.
