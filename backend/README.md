# Co-Climate Backend

This folder contains a separate Node.js + Express backend for the Co-Climate frontend.

## Run

```bash
cd backend
npm install
npm start
```

## MongoDB Atlas setup

1. Create a MongoDB Atlas cluster and a database user.
2. Copy your connection string from Atlas.
3. Open the backend .env file and replace the MongoDB URI with your Atlas value.
4. Restart the backend.

Example Atlas URI:

```env
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-url>/co-climate?retryWrites=true&w=majority
```

Once the URI is valid, the app will store users, monitoring data, projects, sites, milestones, documents, and alerts in MongoDB instead of staying in demo mode.

## API Endpoints

- GET /api/health
- POST /api/login
- GET /api/dashboard
