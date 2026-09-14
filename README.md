# StudySpace – Smart Library & Study Space Reservation System

StudySpace is a full-stack web application designed for university campuses to manage desk and study space reservations with real-time architectural floor plans, role-based access control, and transaction-safe overlap prevention.

---

## 🌟 Key Features

- **4-Level Central Library Floorplan**:
  - **Level 1**: Main Reading Hall (40 Desks • 9 Grand Tables • Circulation Help Desk)
  - **Level 2**: Collaborative Commons (32 Desks • 6 Team Tables • High-Speed Tech Bar)
  - **Level 3**: Silent Study & Research (40 Desks • 8 West Wall Solo Carrels • 8 Silent Tables • 3-Bay Reference Bookshelf)
  - **Level 4**: Deep Focus & Penthouse Pods (44 Desks • 12 West Wall Solo Focus Pods • 8 Thesis Tables • 3-Bay Thesis Archive Stacks)
- **Zero Double-Booking Engine**: Mathematical SQL interval overlap protection evaluated within ACID database transactions.
- **Dynamic Color Indicators**: Real-time 🟢 Available, 🔴 Reserved, and 🔵 Selected seat states.
- **Stateless Authentication**: JWT session security with bcrypt password hashing (10 salt rounds).
- **Comprehensive Academic Report**: Full university assignment report provided in [`documentation.md`](./documentation.md).
- **Viva Preparation Cheat Sheet**: Examiner Q&A defense guide provided in [`viva_prep.md`](./viva_prep.md).

---

## 🚀 Quick Start (Local Setup)

### 1. Prerequisites & Repository Clone
- Node.js 18+ & npm
- Git

```bash
git clone https://github.com/ETSuhasAradhya/StudySpace.git
cd StudySpace
```

### 2. Backend Setup
```bash
cd backend
npm install
node db/init.js    # Initializes schema & seeds sample data
npm start          # Runs on http://localhost:5000
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev        # Runs on http://localhost:5173
```

---

## 🎓 Demo Credentials

| Role | Email | Password | Quick Shortcut |
| :--- | :--- | :--- | :--- |
| **Student** | `alex@university.edu` | `password123` | Click **"🎓 Student: Alex"** on login page |
| **Student** | `sara@university.edu` | `password123` | Manual sign-in |
| **Administrator** | `admin@studyspace.com` | `password123` | Click **"⚡ Admin: Campus"** on login page |

---

## ☁️ Cloud Deployment Guide

### Backend Deployment (Render)
1. Push repository to GitHub.
2. Log in to [render.com](https://render.com) and create a **New Web Service** pointing to your repository.
3. Configure settings:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. Add Environment Variables:
   - `DATABASE_URL`: `postgresql://neondb_owner:npg_gbpE8YK9yURL@ep-wispy-king-ayfkd1d7-pooler.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require`
   - `JWT_SECRET`: Any 32-character random string
   - `NODE_ENV`: `production`

### Frontend Deployment (Vercel)
1. Log in to [vercel.com](https://vercel.com) and import the repository.
2. Configure project:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Add Environment Variable:
   - `VITE_API_URL`: URL of your deployed Render backend (e.g., `https://studyspace-backend.onrender.com`)
