# FlatSync

A full-stack MERN app that helps students and professionals find compatible flatmates using AI-based lifestyle matching, real-time in-app messaging, and map-based flat listings.

## Features

- **Lifestyle onboarding** — a 10-question lifestyle survey (food preference, sleep schedule, cleanliness, etc.) used to calculate compatibility between users
- **AI compatibility scoring** — match scores generated via the Gemini API
- **Map-based flat discovery** — search and pin locations using Leaflet + OpenStreetMap (free, no API key required)
- **Geospatial radius search** — find flats within a chosen radius (1–50 km) using MongoDB's geospatial queries (`$geoNear` / `$geoWithin`)
- **Real-time messaging** — in-app chat powered by Socket.io
- **Photo uploads** — flat listing photos stored via Cloudinary
- **JWT authentication** — password hashing with bcrypt

## Folder Structure

```
FlatSync-Project/
├── server/                     ← Node.js + Express API
│   ├── config/
│   │   ├── db.js               ← MongoDB connection
│   │   └── cloudinary.js       ← Cloudinary config
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── listingController.js
│   │   ├── matchController.js
│   │   ├── messageController.js
│   │   ├── requestController.js
│   │   └── userController.js
│   ├── middlewares/
│   │   ├── authMiddleware.js   ← JWT auth protection (`protect`)
│   │   └── upload.js           ← Multer file upload handling
│   ├── models/
│   │   ├── Listing.js
│   │   ├── MatchScore.js
│   │   ├── Message.js
│   │   ├── Request.js
│   │   └── User.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── listingRoutes.js
│   │   ├── matchRoutes.js
│   │   ├── messageRoutes.js
│   │   ├── requestRoutes.js
│   │   └── userRoutes.js
│   ├── services/
│   │   └── geminiService.js    ← AI compatibility scoring
│   ├── utils/
│   │   └── cloudinaryUpload.js
│   ├── seedData.js
│   ├── socket.js               ← Socket.io setup
│   ├── server.js                ← Entry point
│   └── .env                    ← Environment variables (see below)
│
└── client/                     ← React app (Vite)
    ├── src/
    │   ├── components/
    │   │   ├── MatchScoreBadge.jsx
    │   │   └── LeafletMapHelpers.jsx   ← Shared map recenter/click helpers
    │   ├── context/
    │   │   ├── AuthContext.jsx
    │   │   └── SocketContext.jsx
    │   ├── pages/
    │   │   ├── Home.jsx
    │   │   ├── Onboarding.jsx          ← Lifestyle survey + Leaflet location pinning
    │   │   ├── FindFlat.jsx            ← Browse / Matches / Map views
    │   │   └── ... (Login, Register, etc.)
    │   ├── utils/
    │   │   ├── axiosInstance.js        ← Configured Axios instance (baseURL from VITE_API_URL)
    │   │   └── compatibility.js        ← Client-side compatibility scoring helper
    │   ├── leafletConfig.js            ← Fixes Leaflet's default marker icon in bundled builds
    │   ├── App.jsx
    │   └── main.jsx
    └── .env                             ← Environment variables (see below)
```

## How to Run

### Step 1 — Set up the backend

```bash
cd server
npm install
```

Create a `.env` file in `server/` with:

```
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<dbname>?appName=Cluster0
JWT_SECRET=your_jwt_secret
PORT=5001

# Required for flat-photo uploads
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Optional: enables AI compatibility scores
GEMINI_API_KEY=your_gemini_api_key
```

```bash
npm run dev     # starts backend on http://localhost:5001
```

### Step 2 — Set up the frontend

```bash
cd client
npm install
```

Create a `.env` file in `client/` with:

```
VITE_API_URL=http://localhost:5001/api
```

```bash
npm run dev     # starts frontend on http://localhost:5173
```

### Step 3 — MongoDB Atlas setup

- Whitelist your IP under **Network Access** in your Atlas project
- Make sure your database user has `readWrite` permissions
- No local MongoDB required if using Atlas

## API Endpoints

**Confirmed in this codebase:**

| Method | URL                          | Protected | Description                                  |
|--------|------------------------------|-----------|-----------------------------------------------|
| POST   | /api/auth/register           | No        | Create new account                           |
| POST   | /api/auth/login              | No        | Login, get JWT token                         |
| POST   | /api/auth/onboarding         | Yes       | Submit lifestyle survey + address            |
| GET    | /api/listings                | No        | Get all listings (or nearby, with query params) |
| POST   | /api/listings                | Yes       | Create a new flat listing (with photos)      |
| GET    | /api/listings/my-listings    | Yes       | Get listings owned by the logged-in user     |
| GET    | /api/listings/:id            | Yes       | Get a single listing                         |
| PUT    | /api/listings/:id            | Yes       | Update a listing                             |
| DELETE | /api/listings/:id            | Yes       | Delete a listing                             |
| POST   | /api/listings/search-area    | No        | Search listings within a polygon boundary (`$geoWithin`) |
| POST   | /api/requests/send           | Yes       | Send a flatmate request for a listing        |
| GET    | /api/requests/outgoing       | Yes       | Get requests sent by the logged-in user      |

**Not yet documented here** — `/api/requests` (remaining endpoints), `/api/messages`, `/api/users`, `/api/match`: these exist in the routes folder but their exact paths weren't confirmed in this conversation. Paste the contents of `requestRoutes.js`, `messageRoutes.js`, `userRoutes.js`, and `matchRoutes.js` if you'd like this table completed accurately rather than guessed.

**Nearby flat discovery details:**
Flat seekers can choose a search radius of 1, 3, 5, 10, 20, or 50 km from either their current location or a searched place. Results are filtered server-side using MongoDB's geospatial index, so only flats inside the selected radius are returned. The frontend shows the approximate distance to each flat and draws the active search radius on the map.

## Tech Stack

- **Frontend:** React (Vite), React Router, Axios, Context API, Leaflet / react-leaflet, GSAP, Tailwind CSS, Socket.io Client
- **Backend:** Node.js, Express, Socket.io
- **Database:** MongoDB + Mongoose (geospatial indexing)
- **Auth:** JWT + bcrypt
- **File Storage:** Cloudinary
- **AI:** Google Gemini API (compatibility scoring)
- **Maps:** Leaflet + OpenStreetMap tiles, Nominatim (free geocoding — no API key required)
