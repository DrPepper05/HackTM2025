# HackTM2025
This is the repository for HackTM2025 for the 5 AI-gents team



# 🛠 Project Setup Guide
This project is structured as a monorepo containing both the frontend and backend applications. You can manage and run everything from the root directory using simple commands.

# 📁 Project Structure

```bash
HackTM2025/
├── backend/      ← Express.js API (Node.js)
├── frontend/     ← React + Tailwind Admin Panel
├── package.json  ← Root file for controlling both apps
```

# ✅ One-Time Setup

Before running the app, install dependencies for both frontend and backend:

```bash
npm run install-all
```

This will:
- Run ```npm``` install inside ```./frontend```
- Run ```npm``` install inside ```./backend```


# 🚀 Start the Project

To run both frontend and backend in parallel:

```bash
npm run dev
```

This will:
- Start the React frontend (Vite) on [http://localhost:5173](http://localhost:5173)
- Start the Express backend on [http://localhost:3000](http://localhost:3000)




# 🔁 Available Commands (Root)

| Command               | Description                             |
|------------------------|-----------------------------------------|
| `npm run install-all` | Installs dependencies for both apps     |
| `npm run dev`         | Runs both frontend and backend together |


# 🧪 Troubleshooting
- If you see an error about ```concurrently```, run:

```bash
npm install concurrency --save-dev
```


Never forget!
git push --force main -Cosmin
