# Co-Climate Dashboard

Forest restoration & ESG plantation monitoring dashboard, with:
- 📸 Camera capture for field photos (browser Camera API)
- 📍 GPS-based site tagging (browser Geolocation API)
- 🗺️ Address lookup via OpenStreetMap Nominatim
- 🌤️ Live weather per site via Open-Meteo
- Installable as an app on Android / iOS / desktop (PWA)

## Project structure

```
co-climate/
├── backend/     Node.js + Express API (serves the frontend too)
└── frontend/    HTML/CSS/JS dashboard (static, no build step)
```

## Local setup

1. Clone the repo:
   ```bash
   git clone <your-repo-url>
   cd co-climate/backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create your local environment file:
   ```bash
   cp .env.example .env
   ```
   Then edit `.env` and fill in your own MongoDB Atlas connection string and a JWT secret.
   **Never commit `.env`** — it's already in `.gitignore`.
4. Start the server:
   ```bash
   npm start
   ```
5. Open the app in your browser at the URL printed in the terminal (usually `http://localhost:5000`, or the next free port if 5000 is busy).

If you skip step 3, the app still runs fine in **demo mode** (in-memory data, resets on restart) — MongoDB is optional for local testing.

## Demo accounts

| Role | Email | Password |
|---|---|---|
| Admin | admin@coclimate.org | admin123 |
| Manager | manager@coclimate.org | manager123 |
| Field Officer | field@coclimate.org | field123 |
| Standard User | user@coclimate.org | user123 |

## Installing as an app (PWA)

Once the app is running over **HTTPS** (see deployment below) or on `localhost`:
- **Android (Chrome):** open the site → menu (⋮) → "Add to Home screen" / "Install app"
- **iOS (Safari):** open the site → Share icon → "Add to Home Screen"
- **Desktop (Chrome/Edge):** install icon in the address bar

> Camera and Geolocation only work over **HTTPS** or `localhost` — this is a browser security requirement, not something this app controls.

## Deploying so teammates/testers can access it remotely

Any Node-friendly host works. Quick options:
- **Render** (render.com) — connect your GitHub repo, set the root directory to `backend`, set env vars (`MONGODB_URI`, `JWT_SECRET`) in the dashboard, deploy. Free HTTPS included.
- **Railway** (railway.app) — similar flow, also free HTTPS.
- **Fly.io** — more control, still free tier available.

After deploying, share the resulting `https://your-app.onrender.com` (or similar) URL with your team — they can use it directly in a browser or install it as a PWA on their phones.

## Contributing (team workflow)

```bash
git clone <your-repo-url>
git checkout -b your-feature-branch
# make changes
git add .
git commit -m "Describe your change"
git push origin your-feature-branch
```
Then open a pull request into `main` on GitHub.
