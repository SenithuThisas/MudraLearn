# 🚀 Daily Development Workflow – MudraLearn

## 📌 Overview
When starting work, open three terminal tabs and run the full stack services (Frontend, Backend, ML). Also ensure required background services are running.

---

## 💻 Full Startup Commands

### Frontend (React / Vite)
cd ~/Documents/Coding\ folder/BscFinalYear/mudralearn/frontend && npm run dev

### Backend (FastAPI)
cd ~/Documents/Coding\ folder/BscFinalYear/mudralearn/backend && source venv/bin/activate && uvicorn app.main:app --reload

### ML (Jupyter / Training)
cd ~/Documents/Coding\ folder/BscFinalYear/mudralearn/ml && source venv/bin/activate && jupyter notebook

---

## ⚙️ Background Services (Run Once Per Day)
brew services start postgresql@16 && brew services start redis

---

## 🔍 Check Running Services
brew services list

---

## 📝 Notes
- Run each service in a separate terminal tab.
- Always activate virtual environments before running Backend or ML services.
- Start background services once per day unless they are stopped or restarted.