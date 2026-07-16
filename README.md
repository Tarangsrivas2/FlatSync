# FlatSync-Project

A Full-Stack Web App that helps Students and Professionals Find Compatible Flatmates using AI-based Lifestyle Matching, in-app messaging, and map-based listings.

## Nearby flat discovery

Flat seekers can choose a search radius of 1, 3, 5, 10, 20, or 50 km from either their current location or a searched place. The app:

- filters results on the server using MongoDB's geospatial index, so only flats inside the selected radius are returned;
- shows the approximate distance to each flat in the list and detail view; and
- draws the active search area on the map.

Flat owners continue to post a vacancy through **My Flat Listings**; people searching within their chosen area can then send them a flatmate request.

The nearby search endpoint accepts `GET /api/listings?lat=<latitude>&lng=<longitude>&radiusKm=<1-50>`.

# FlatSync — AI-Powered Flatmate Finder

## Folder Structure

```
FlatSync/
├── backend/                  ← Node.js + Express API
│   ├── controllers/          ← Business logic functions
│   │   ├── authController.js
│   │   ├── listingsController.js
│   │   └── contactController.js
│   ├── middleware/           ← JWT auth protection
│   │   └── authMiddleware.js
│   ├── models/               ← MongoDB schemas
│   │   ├── User.js
│   │   └── Listing.js
│   ├── routes/               ← API route definitions
│   │   ├── auth.js
│   │   ├── listings.js
│   │   └── contact.js
│   ├── .env.example          ← Copy this to .env and fill values
│   ├── package.json
│   └── server.js             ← Entry point
│
└── frontend/                 ← React app
    ├── src/
    │   ├── components/       ← Reusable components
    │   │   ├── Navbar.jsx
    │   │   ├── PageHeader.jsx
    │   │   ├── FlatmateCard.jsx
    │   │   └── MatchBadge.jsx
    │   ├── context/          ← Global state
    │   │   └── AuthContext.jsx
    │   ├── pages/            ← One file per page/route
    │   │   ├── Home.jsx
    │   │   ├── FindFlatmate.jsx
    │   │   ├── About.jsx
    │   │   ├── Login.jsx
    │   │   └── Register.jsx
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    └── package.json
```

---

## How to Run

### Step 1 — Setup Backend

```bash
cd backend
npm install

# Create your .env file
cp .env.example .env
# Open .env and fill in your MONGO_URI and JWT_SECRET

npm run dev     # starts backend on http://localhost:5000
```

### Step 2 — Setup Frontend

```bash
cd frontend
npm install
npm run dev     # starts frontend on http://localhost:5173
```

### Step 3 — Make sure MongoDB is running
- If using local MongoDB: make sure `mongod` is running
- If using MongoDB Atlas: paste your Atlas connection string in .env

---

## API Endpoints

| Method | URL                      | Protected | Description              |
|--------|--------------------------|-----------|--------------------------|
| POST   | /api/auth/register       | No        | Create new account       |
| POST   | /api/auth/login          | No        | Login, get JWT token     |
| GET    | /api/auth/profile        | Yes       | Get logged-in user info  |
| GET    | /api/listings            | No        | Get all listings         |
| POST   | /api/listings            | Yes       | Post a new listing       |
| DELETE | /api/listings/:id        | Yes       | Delete your listing      |
| POST   | /api/contact             | No        | Submit contact form      |

---

## Tech Stack
- **Frontend:** React.js, React Router, Axios, Context API
- **Backend:** Node.js, Express.js
- **Database:** MongoDB + Mongoose
- **Auth:** JWT (JSON Web Tokens) + bcryptjs

## Team
2 members working on separate GitHub feature branches.