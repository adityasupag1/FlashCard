# FlashDeck — AI-Powered Flashcard Study Platform

A full MERN-stack implementation of the **FlashDeck** professional design — an AI-powered platform that turns PDFs into spaced-repetition flashcard decks.

Built with **MongoDB, Express, React, Node.js**, plus Tailwind CSS, Vite, Recharts, and the SM-2 spaced repetition algorithm. Supports **OpenAI**, Google **Gemini**, or **Anthropic** for card generation (auto-detects whichever key you provide, with OpenAI first).

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
│   ├── config/db.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── deckController.js
│   │   ├── cardController.js
│   │   ├── reviewController.js
│   │   └── statsController.js
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── error.js
│   │   └── upload.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Deck.js
│   │   ├── Card.js
│   │   └── Session.js
│   ├── routes/
│   ├── services/
│   │   ├── aiService.js
│   │   ├── pdfService.js
│   │   └── srsService.js
│   ├── uploads/
│   ├── utils/generateToken.js
│   ├── .env.example
│   ├── package.json
│   └── server.js
│
└── client/
    ├── src/
    │   ├── api/axios.js
    │   ├── context/AuthContext.jsx
    │   ├── components/
    │   ├── pages/
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    ├── index.html
    ├── tailwind.config.js
    ├── vite.config.js
    └── package.json
```

---

## 🚀 Quick Start

### 1. Prerequisites
- Node.js 18+
- npm 9+
- MongoDB (local or Atlas)
- One AI API key (OpenAI, Gemini, or Anthropic)

### 2. Clone & Install

```bash
cd flashdeck

# Backend
cd server
cp .env.example .env
npm install

# Frontend
cd ../client
npm install
```

### 3. Configure `server/.env`

```bash
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/flashdeck

JWT_SECRET=your_long_random_secret
JWT_EXPIRE=30d

OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-4o-mini
CLIENT_URL=http://localhost:5173
```

### 4. Run Development Servers

```bash
# Backend
cd server
npm run dev

# Frontend
cd client
npm run dev
```

Open http://localhost:5173

---

## 🧠 AI Generation Flow

1. Upload PDF  
2. Extract text using pdf-parse  
3. Chunk into ~3500-character segments  
4. Send structured prompt to AI  
5. Parse JSON response  
6. Insert cards into MongoDB  

Fallback heuristic used if no AI key exists.

---

## 🔁 SM-2 Spaced Repetition

| Grade | Shortcut | Interval Effect | Ease Factor |
|-------|----------|----------------|------------|
| Again | 1 | Reset to 10 min | Decrease |
| Hard | 2 | Small increase | Slight decrease |
| Good | 3 | interval × ef | No change |
| Easy | 4 | interval × ef + bump | Increase |

Cards become **mastered** when:
- interval ≥ 21 days
- repetitions ≥ 4

---

## 📡 API Overview

All protected routes require:

Authorization: Bearer <token>

### Auth
POST `/api/auth/register`  
POST `/api/auth/login`  
GET `/api/auth/me`  

### Decks
GET `/api/decks`  
POST `/api/decks`  
POST `/api/decks/generate`  
PUT `/api/decks/:id`  
DELETE `/api/decks/:id`  

### Cards
GET `/api/cards/deck/:deckId`  
POST `/api/cards`  
PUT `/api/cards/:id`  
DELETE `/api/cards/:id`  

### Reviews
POST `/api/reviews/grade`  
POST `/api/reviews/session/start`  
POST `/api/reviews/session/:id/finish`  

### Stats
GET `/api/stats/overview`  
GET `/api/stats/activity`  
GET `/api/stats/mastery`  

---

## 🚢 Deployment

### Single Service (Render / Railway)

```bash
cd client
npm run build

cd ../server
NODE_ENV=production npm start
```

Set environment variables:
- MONGO_URI
- JWT_SECRET
- OPENAI_API_KEY

---

## 🛠 Troubleshooting

**AI errors**
- Verify API key
- Restart server
- Use non-scanned PDF

**MongoDB errors**
- Ensure mongod running
- Check Atlas IP whitelist
- Confirm correct MONGO_URI

**401 loops**
- Clear localStorage
- Ensure JWT_SECRET unchanged

---

## 📄 License

MIT

---

## 👤 Credit

Design based on FlashDeck Stitch system.  
Built as a complete MERN reference implementation with SM-2 spaced repetition.