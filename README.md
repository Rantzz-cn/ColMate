# ColMate — College Chat Matchmaking MVP

A real-time college student matchmaking app built with React Native (Expo), Node.js/Express, PostgreSQL, and Socket.IO.

## 📋 Features

- **User Auth**: JWT-based registration & login with bcrypt password hashing
- **Profile Setup**: University + interests selection
- **Smart Matchmaking**: Interest-based scoring with optional university bonus
- **Real-time Chat**: Socket.IO WebSockets for 1-on-1 messaging
- **Match History**: Persistent match and message records in PostgreSQL

## 🗂️ Project Structure

```
ColMate/
├── backend/           # Express + Prisma + Socket.IO
│   ├── src/
│   │   ├── index.js           # Main server & routes
│   │   ├── auth.js            # JWT & Prisma helpers
│   │   ├── matchmaker.js      # Matchmaking logic
│   │   └── prisma.js          # Prisma client
│   ├── prisma/
│   │   ├── schema.prisma      # Database schema
│   │   └── seed.js            # Sample data
│   ├── .env.example           # Env template
│   └── package.json
└── frontend/          # Expo (React Native)
    ├── App.js         # Main chat UI
    └── package.json
```

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+
- **PostgreSQL** 12+ (local or cloud)
- **npm**

### Backend Setup

1. **Navigate to backend:**
   ```bash
   cd backend
   ```

2. **Create `.env` file from template:**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and set your Postgres connection:
   ```env
   DATABASE_URL=postgresql://user:password@localhost:5432/colmate
   JWT_SECRET=your_secure_jwt_secret_here
   PORT=4000
   ```

3. **Install dependencies:**
   ```bash
   npm install
   ```

4. **Generate Prisma client & run migrations:**
   ```bash
   npx prisma generate
   npx prisma migrate dev --name init
   ```

5. **Seed sample data (optional):**
   ```bash
   npm run seed
   ```

6. **Start dev server:**
   ```bash
   npm run dev
   ```
   Server runs on `http://localhost:4000`

### Frontend Setup

1. **Navigate to frontend:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start Expo dev server:**
   ```bash
   npm start
   ```
   Use Expo Go app (iOS/Android) to scan QR code, or run in web/emulator.

## 📡 API Endpoints

### Auth
- `POST /auth/register` — Create account (email, password, name, university, interests)
- `POST /auth/login` — Get JWT token
- `GET /me` — Get current user profile (requires JWT)

### WebSocket Events (Socket.IO)
- `joinQueue` — Enter matchmaking queue with profile
- `leaveQueue` — Exit queue
- `matched` — Emitted when a match is found
- `disconnect` — Auto-cleanup on disconnect

## 🧪 Test the System

1. **Backend running** on port 4000
2. **Frontend connected** to `ws://localhost:4000`
3. **Try login:**
   ```bash
   curl -X POST http://localhost:4000/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"alice@example.com","password":"password123"}'
   ```
   (Sample users created by seed: alice, bob, carol, dave)

## 🏗️ Architecture Notes

- **Matchmaker** (`backend/src/matchmaker.js`): In-memory queue for MVP. Scale with Redis for production.
- **Auth** (`backend/src/auth.js`): JWT with 7-day expiry. Supports Prisma-backed user lookup.
- **Database** (`prisma/schema.prisma`): Users, Universities, Interests, Matches, Messages.
- **Chat**: Socket.IO rooms per match (roomId = `userA#userB`).

## 🚀 Deployment (Railway)

See [DEPLOY.md](DEPLOY.md) for Railway hosting setup (Postgres + Node backend).

## 📝 Next Steps

- [ ] Add full chat UI (message sending/receiving)
- [ ] User blocking & reporting
- [ ] Rate limiting & abuse detection
- [ ] Push notifications
- [ ] Profile avatars & verification
- [ ] Integration tests & e2e

## 📄 License

MIT
