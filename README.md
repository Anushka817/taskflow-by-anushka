# Premium Task Management Dashboard

A full-stack, production-ready Task Management Workspace built with **React 18**, **TypeScript**, **Vite**, **Express**, and local JSON storage persistence. This application supports complete multi-user authentication (Register/Login/Logout/Profile) and comprehensive task management (Kanban, Grid List, Interactive Calendar, Stats/Charts, Dark/Light Theme).

It is engineered to run locally as a combined Express+Vite application, as well as deploy serverless endpoints directly to **Vercel** via Vercel Serverless Functions.

---

## 🚀 Key Features

1. **Authentication Engine**:
   - Register new workspace accounts.
   - Login to existing workspace sessions.
   - Profile authentication tracking.
   - High-grade security via salt and PBKDF2/scrypt password hashing.

2. **Core Task Management**:
   - **Kanban Board**: Drag-and-drop workflow status columns (`Pending`, `In Progress`, `Completed`).
   - **Operational Queue**: Grid view listing of all tasks.
   - **Interactive Calendar**: Full-size calendar displaying tasks on their due dates with edit/view dialogs.
   - **Live Activity Feed**: Real-time event log for creation, status toggle, edits, and deletions.

3. **Analytics Dashboard**:
   - Completion rate tracking.
   - Priority metrics (High/Medium/Low distribution).
   - Overdue tasks calculations.
   - Category-wise analysis (Work, Personal, Health, Finance, etc.) using clean vector charts.

4. **Multi-Theme Experience**:
   - Seamless toggling between **Cosmic Obsidian Dark** and **Clean Slate Light** themes.

---

## 📁 Project Structure

```
project/
├── api/                   # Vercel Serverless Functions
│   ├── auth/
│   │   ├── login.ts       # POST /api/auth/login
│   │   ├── logout.ts      # POST /api/auth/logout
│   │   ├── register.ts    # POST /api/auth/register
│   │   └── user.ts        # GET /api/auth/user
│   ├── _db.ts             # Shared Vercel DB & Auth module
│   └── tasks.ts           # CRUD, Stats & sorting (/api/tasks)
├── src/                   # Client-side React application
│   ├── components/        # Extracted UI components
│   │   ├── AuthLayout.tsx
│   │   ├── CalendarView.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Navbar.tsx
│   │   ├── StatsSection.tsx
│   │   ├── TaskCard.tsx
│   │   ├── TaskModal.tsx
│   │   ├── Toast.tsx
│   │   └── VisualCharts.tsx
│   ├── lib/
│   │   └── api.ts         # Central Client-side API caller
│   ├── App.tsx            # Main React Entry & initialization
│   ├── index.css          # Global Tailwind CSS Imports
│   ├── main.tsx           # React bootstrap entry
│   └── types.ts           # Shared TypeScript models
├── server.ts              # Local Express + Vite integration server
├── tasks_db.json          # Shared database persistence file
├── package.json           # Scripts & package dependencies
├── tsconfig.json          # TypeScript compilation settings
├── vite.config.ts         # Vite configuration & tailwind plugins
├── index.html             # Client HTML container template
├── vercel.json            # Vercel configuration & rewrites
└── README.md              # Project documentation
```

---

## 🛠️ Local Development Setup

Follow these simple steps to run the application locally on your computer:

### 1. Install Dependencies
```bash
npm install
```

### 2. Run in Development Mode
This boots up the local Express backend server on port `3000` and configures Vite to hot-reload React assets:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your web browser.

### 3. Build & Run for Production
To bundle assets and compile the Express server into a highly optimized format:
```bash
npm run build
npm start
```

---

## ☁️ Vercel Deployment

This project is fully Vercel-native. The `vercel.json` file is configured with the necessary routing and rewrites to seamlessly map Serverless Functions.

To deploy onto Vercel:
1. Initialize a new project on the [Vercel Dashboard](https://vercel.com).
2. Connect your GitHub repository or use the Vercel CLI:
   ```bash
   vercel
   ```
3. Vercel will automatically detect the Vite client build configuration and deploy the functions inside the `/api` folder. No extra code adjustments are required.
