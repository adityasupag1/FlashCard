# FlashDeck — AI-Powered Flashcard Study Platform

A full MERN-stack implementation of the **FlashDeck** Stitch design — an AI-powered platform that turns PDFs into spaced-repetition flashcard decks.

Built with **MongoDB, Express, React, Node.js**, plus Tailwind CSS, Vite, Recharts, and the SM-2 spaced repetition algorithm. Supports Google **Gemini**, **OpenAI**, or **Anthropic** for card generation (auto-detects whichever key you provide).

![Tech Stack](https://img.shields.io/badge/stack-MERN-0058bd)
![License](https://img.shields.io/badge/license-MIT-blue)

---

## ✨ Features

- 📄 **PDF → Flashcards** — Drop in any PDF up to 50MB, AI generates quality Q&A cards
- 🧠 **Spaced repetition (SM-2)** — Cards come back at the right time based on how well you remember them
- 🎯 **4-grade review** — Again / Hard / Good / Easy (keyboard shortcuts 1–4)
- 📊 **Progress analytics** — Bar charts, line charts, pie charts of subject distribution, streak tracking
- 🔐 **JWT auth** — Register, sign in, protected routes, profile update, password change
- 📚 **Deck management** — Create, edit, pin, publish, delete; full card CRUD with topic/hint support
- 🌐 **Community Explore page** — Publish decks for others to study
- 🎨 **Pixel-accurate design** — Exact Material 3 palette, Lexend font, and component patterns from the Stitch design system
- 📱 **Fully responsive** — Desktop, tablet, mobile

---

## 🗂 Project Structure

```
flashdeck/
├── server/                          # Express + MongoDB backend
│   ├── config/db.js                 # Mongo connection
│   ├── controllers/                 # Route handlers
│   │   ├── authController.js
│   │   ├── deckController.js        # CRUD + AI generation
│   │   ├── cardController.js
│   │   ├── reviewController.js      # SM-2 grading + sessions
│   │   └── statsController.js       # Analytics endpoints
│   ├── middleware/
│   │   ├── auth.js                  # JWT protect
│   │   ├── error.js
│   │   └── upload.js                # Multer 50MB PDF upload
│   ├── models/                      # Mongoose schemas
│   │   ├── User.js                  # with bcrypt + streak
│   │   ├── Deck.js
│   │   ├── Card.js                  # with SM-2 state
│   │   └── Session.js
│   ├── routes/                      # /api/auth, /api/decks, /api/cards, /api/reviews, /api/stats
│   ├── services/
│   │   ├── aiService.js             # Gemini/OpenAI/Anthropic
│   │   ├── pdfService.js            # pdf-parse + chunking
│   │   └── srsService.js            # SM-2 algorithm
│   ├── uploads/                     # Temp PDF storage (auto-cleaned)
│   ├── utils/generateToken.js
│   ├── .env.example
│   ├── package.json
│   └── server.js
│
└── client/                          # React + Vite + Tailwind frontend
    ├── src/
    │   ├── api/axios.js             # API client with auto-token
    │   ├── context/AuthContext.jsx  # JWT + localStorage
    │   ├── components/
    │   │   ├── Navbar.jsx
    │   │   ├── Footer.jsx
    │   │   ├── DeckCard.jsx
    │   │   ├── Flashcard.jsx        # 3D flip animation
    │   │   ├── Modal.jsx
    │   │   └── ProtectedRoute.jsx
    │   ├── pages/
    │   │   ├── Home.jsx             # Landing
    │   │   ├── SignIn.jsx / SignUp.jsx
    │   │   ├── MyDecks.jsx          # Dashboard
    │   │   ├── CreateDeck.jsx       # PDF upload + AI generation
    │   │   ├── DeckDetail.jsx       # View + edit cards
    │   │   ├── StudySession.jsx     # Core study loop
    │   │   ├── SessionComplete.jsx
    │   │   ├── ReviewDeck.jsx
    │   │   ├── ProgressAnalytics.jsx
    │   │   ├── ExploreDecks.jsx
    │   │   ├── Settings.jsx
    │   │   └── NotFound.jsx
    │   ├── App.jsx                  # Routes
    │   ├── main.jsx
    │   └── index.css                # Tailwind + design tokens
    ├── index.html                   # loads Lexend + Material Symbols
    ├── tailwind.config.js           # Exact Stitch palette
    ├── vite.config.js               # /api proxy
    └── package.json
```

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js 18+** and **npm 9+**
- **MongoDB** — either local (`mongod`) or a free Atlas cluster → https://www.mongodb.com/atlas
- **An AI API key** — get any one of:
  - Google Gemini (free tier available) → https://aistudio.google.com/app/apikey
  - OpenAI → https://platform.openai.com/api-keys
  - Anthropic → https://console.anthropic.com/

### 2. Clone & install

```bash
# Extract the zip, then:
cd flashdeck

# Backend
cd server
cp .env.example .env
# edit .env — see next section
npm install

# Frontend (in a new terminal)
cd ../client
npm install
```

### 3. Configure `server/.env`

```bash
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/flashdeck
# OR an Atlas URL: mongodb+srv://user:pass@cluster.mongodb.net/flashdeck

JWT_SECRET=pick_a_long_random_string_at_least_32_chars
JWT_EXPIRE=30d

# Provide ONE of these — server auto-picks whichever is set
GEMINI_API_KEY=your_gemini_key_here
# OPENAI_API_KEY=
# ANTHROPIC_API_KEY=

CLIENT_URL=http://localhost:5173
```

### 4. Run in development

```bash
# Terminal 1 — backend
cd server
npm run dev          # runs on :5000

# Terminal 2 — frontend
cd client
npm run dev          # runs on :5173
```

Open **http://localhost:5173** in your browser. Sign up, upload a PDF, and watch the AI generate cards.

---

## 🧠 How the AI generation works

1. User uploads a PDF on `/create`
2. `pdf-parse` extracts the text
3. `pdfService.chunkText()` splits long docs into ~3,500-char chunks on paragraph boundaries
4. Each chunk is sent to the configured AI with a structured prompt asking for JSON cards
5. Responses are parsed + deduplicated, then inserted into MongoDB as `Card` documents
6. The deck's `cardCount` / `newCount` / etc. are cached for fast UI rendering

If no AI key is configured, `aiService.js` falls back to a simple heuristic extractor so the demo still works (though card quality is much lower).

---

## 🔁 How SM-2 Spaced Repetition Works

Located in `server/services/srsService.js`:

| Grade  | Shortcut | Effect on interval | Effect on ease factor |
|--------|----------|-------------------|----------------------|
| Again  | 1        | Reset to 10 min   | Big decrease         |
| Hard   | 2        | Small increase    | Slight decrease      |
| Good   | 3        | `interval × ef`   | No change            |
| Easy   | 4        | `interval × ef` + bump | Increase        |

When a card reaches `interval ≥ 21 days` AND `repetitions ≥ 4`, its status promotes to **mastered**. The `dueDate` determines when it shows up again in a study session.

---

## 📡 API Reference

All authenticated routes need `Authorization: Bearer <token>` header.

### Auth — `/api/auth`
| Method | Route       | Description              |
|--------|-------------|--------------------------|
| POST   | `/register` | Create account → token   |
| POST   | `/login`    | Sign in → token          |
| GET    | `/me`       | Current user             |
| PUT    | `/me`       | Update profile/prefs     |

### Decks — `/api/decks`
| Method | Route         | Description                               |
|--------|---------------|-------------------------------------------|
| GET    | `/`           | List my decks (supports `?q` and `?subject`) |
| GET    | `/public`     | Public community decks (no auth)          |
| GET    | `/:id`        | Deck + cards + due count                  |
| POST   | `/`           | Create blank deck                         |
| POST   | `/generate`   | Multipart: upload PDF + AI generation     |
| PUT    | `/:id`        | Update title/subject/pin/public           |
| DELETE | `/:id`        | Delete deck + all cards                   |

### Cards — `/api/cards`
| Method | Route                | Description                  |
|--------|----------------------|------------------------------|
| GET    | `/deck/:deckId`      | All cards in deck            |
| GET    | `/deck/:deckId/due`  | Cards due now (`?limit=30`)  |
| POST   | `/`                  | Create card                  |
| PUT    | `/:id`               | Update card                  |
| DELETE | `/:id`               | Delete card                  |

### Reviews — `/api/reviews`
| Method | Route                      | Description                    |
|--------|----------------------------|--------------------------------|
| POST   | `/grade`                   | Apply SM-2 to a card           |
| POST   | `/session/start`           | Start study session            |
| POST   | `/session/:id/finish`      | End session, update streak     |

### Stats — `/api/stats`
| Method | Route        | Description                                      |
|--------|--------------|--------------------------------------------------|
| GET    | `/overview`  | Totals + streak for dashboard                    |
| GET    | `/activity`  | 30-day activity + subject distribution           |
| GET    | `/mastery`   | Mastery timeline (cumulative)                    |

---

## 🎨 Design System

The frontend implements the exact Stitch FlashDeck design system — see `client/tailwind.config.js`.

**Core colors:**
- Primary blue: `#0058bd`
- Tertiary green: `#006b2b`
- Secondary yellow: `#795900` with container `#febf0d`
- Error red: `#ba1a1a`
- Section backgrounds: `#E8F0FE` / `#FFF8E1` / `#E6F4EA` / `#FCE8E6`

**Typography:**
- Font: **Lexend** (loaded from Google Fonts)
- `text-h1-hero` = 48px/700, `text-h2-section` = 32px/700, `text-h3-card` = 24px/700

**Components:**
- Cards: white, 8px radius, shadow `0 1px 3px rgba(0,0,0,0.10)`, 4px colored top border
- Flashcards: 16px radius, shadow `0 8px 24px rgba(0,0,0,0.12)`, 3D flip on click
- Buttons: primary/secondary/tertiary with `scale(1.03)` hover and `scale(0.97)` click

---

## 🧪 Testing the flow manually

1. **Sign up** at `/signup`
2. Go to **Create** → upload a PDF (any chapter, lecture notes, short research paper)
3. Wait 20–60 seconds — watch the progress bar go through 4 stages
4. You'll land on the **Deck Detail** page with generated cards
5. Click **"Study now"** — cards appear one at a time, press **Space** to flip, then **1–4** to grade
6. Finish session → **Session Complete** screen with accuracy + streak
7. Visit **Progress** to see your charts fill in over days

---

## 🚢 Deployment

### Option A: Single service (Render / Railway / Fly.io)

The backend is configured to serve the frontend's `dist/` folder in production:

```bash
# Build frontend
cd client
npm run build

# Start backend in production mode
cd ../server
NODE_ENV=production npm start
```

In your host's dashboard:
- **Build command:** `cd client && npm install && npm run build && cd ../server && npm install`
- **Start command:** `cd server && NODE_ENV=production node server.js`
- **Environment variables:** Set `MONGO_URI`, `JWT_SECRET`, `GEMINI_API_KEY` (or one of the others)

### Option B: Split deployment (Vercel frontend + Render backend)

**Backend** (Render): Deploy `server/` as a Node service. Set all env vars.
**Frontend** (Vercel): Deploy `client/`. Set `VITE_API_URL=https://your-api.onrender.com/api` in Vercel's environment variables.

### Option C: Docker (optional)
Dockerfiles not included but trivial to add — pin `node:20-alpine`, copy + install + build.

---

## 🛠 Troubleshooting

**"AI could not generate cards"**
- Check your API key is set in `server/.env`
- Make sure you restarted the backend after editing `.env`
- Try a different, shorter PDF — some scanned PDFs have no extractable text

**"MongoDB connection error"**
- For local Mongo: make sure `mongod` is running
- For Atlas: check your IP is whitelisted (or set `0.0.0.0/0` for dev)
- Verify `MONGO_URI` has no extra spaces and includes `/flashdeck` at the end

**Port already in use**
- Change `PORT` in `server/.env` and update `vite.config.js` proxy target

**401 Unauthorized loops**
- Clear `localStorage.flashdeck_user` in browser devtools and sign in again
- Usually means your `JWT_SECRET` changed between restarts

---

## 📄 License

MIT — free to use for any purpose, including commercial.

---

## 👤 Credit

Design based on the **FlashDeck** Stitch design system.
Built as a complete MERN reference implementation with authentic SM-2 spaced repetition.
#   F l a s h C a r d  
 