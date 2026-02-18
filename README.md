# Royal Golf Club Performance Tracker

A professional, desktop-first golf performance and stat-tracking application tailored specifically for the Royal Golf Club. This app focuses on rapid round entry, deep statistical analysis, and historical performance tracking.

## Key Features

### Intelligence Dashboard
- Advanced Stat Cards: Real-time calculation of Handicap Index, Average Score, and Putts per Round.
- Stroke Leaks Analysis: Automatic detection of game-killers including 3-Putts, Double Bogeys+, and Missed Fairways.
- 18-hole projection for 9-hole rounds.

### Precision Scorecard
- Official Course Data: Pre-loaded with official pars, yardages, and handicap indices for all tee sets (Black, Gold, Blue, White, Red).
- Pro-Style Scoring: Visual shape-coding for scores (Red Circles for Birdies/Eagles, Sharp Blue Squares for Bogeys/Doubles).
- Hole-by-Hole Detail: Track strokes, putts, Fairways in Regulation (FIR), and individual hole notes.
- Focus Flow: Integrated auto-advance logic for rapid score entry during or after play.

### Career Profile
- Structured layout showing performance buckets for Last 30 days, Last 60 days, and Lifetime.
- Performance Splits: View GIR%, FIR%, and scoring averages filtered by specific tee sets.

## Tech Stack

- Frontend: Vue 3 (Vite), Pinia (State Management), Vue Router.
- Backend: Node.js, Express.
- Database: SQLite.
- Authentication: Custom Session-Token based system with salted hashing.

## Getting Started

### 1. Backend Setup
```bash
cd backend
npm install
npm run dev
```
The server will run on http://localhost:3333.

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
The application will be available at http://localhost:5173.

## Development Debugging
The backend includes a seeding route for testing the dashboard's analytics:
- Seed Mock Data: Use the internal debug button in the Dashboard header to generate randomized 9 and 18-hole rounds across the last 90 days.
