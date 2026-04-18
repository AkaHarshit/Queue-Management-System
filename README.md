# QueueFlow — Queue Management System

A comprehensive Queue Management System designed for **Salons** and **Hospitals** to efficiently manage customer/patient queues, reduce waiting times, and improve service delivery through digital token-based queuing.

**🚀 Vercel Serverless & PostgreSQL Ready**: This application has been fully refactored for cloud deployment using a Serverless Node.js backend on Vercel and an asynchronous PostgreSQL database architecture.

## ✨ Features

### 🎫 Token System
- Automatic token number generation per service
- Real-time token status tracking (Waiting → In Progress → Completed)
- Estimated waiting time calculation
- Queue position updates

### 👥 Role-Based Dashboards
- **Customer Dashboard** — Join queues, view token status, cancel tokens, view history
- **Staff Dashboard** — View assigned tokens, start/complete services, queue statistics
- **Admin Dashboard** — System overview, manage services & users, monitor all queues, analytics

### 🔔 Real-Time Notifications
- HTTP Short-Polling for live, serverless-compatible updates
- In-app notification persistence with mark-as-read
- Queue position change alerts
- Service start/completion notifications

### 📊 Analytics & Reporting
- Today's token statistics (total, waiting, in-progress, completed)
- Average wait time and service time
- Per-service queue monitoring
- Active queue summary

## 🏗️ Architecture

### Design Patterns
| Pattern | Usage |
|---------|-------|
| **Singleton** | `DatabaseConnection`, `ConfigManager` |
| **Repository** | `UserRepository`, `TokenRepository`, `QueueRepository`, etc. |
| **Factory** | `TokenFactory` for token creation with auto-numbering |
| **Strategy** | `INotificationStrategy` → `InAppNotificationStrategy` |

### SOLID Principles
- **SRP** — Each class has a single responsibility (controllers, services, repositories)
- **OCP** — New notification channels via Strategy Pattern without modifying existing code
- **LSP** — `Customer`, `Staff`, `Admin` extend `User` and are fully substitutable
- **ISP** — Repository interfaces split into `IReadRepository` and `IWriteRepository`
- **DIP** — Services depend on repository interfaces, not concrete implementations

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js + TypeScript (Vercel Serverless Functions)
- **Framework**: Express.js
- **Database**: PostgreSQL (via `pg`)
- **Auth**: JWT (JSON Web Tokens) + bcryptjs
- **Real-time**: HTTP Short-Polling

### Frontend
- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite
- **Styling**: Vanilla CSS (custom design system)
- **Real-time**: Native React `setInterval` Polling

## 📁 Project Structure

```
├── server/
│   ├── api/             # Vercel Serverless entrypoint
│   │   └── index.ts
│   ├── src/
│   │   ├── config/      # Singleton configs (database, app settings)
│   │   ├── controllers/ # REST API controllers
│   │   ├── factories/   # Factory pattern (TokenFactory)
│   │   ├── interfaces/  # TypeScript interfaces (ISP)
│   │   ├── middleware/  # Auth & role-based middleware
│   │   ├── models/      # Domain models (User, Token, Service, etc.)
│   │   ├── repositories/# PostgreSQL data access layer (Repository Pattern)
│   │   ├── routes/      # Express route definitions
│   │   ├── services/    # Business logic layer
│   │   ├── strategies/  # Notification strategies (Strategy Pattern)
│   │   └── index.ts     # Local development bootstrap & DI wiring
│   └── vercel.json      # Vercel deployment configuration
├── client/
│   └── src/
│       ├── components/  # React components (auth, dashboards, common)
│       ├── context/     # React Context (AuthContext)
│       ├── services/    # API client service
│       └── types/       # TypeScript type definitions
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm
- PostgreSQL database instance (local or cloud like Neon/Supabase)

### Installation

```bash
# Clone the repository
git clone https://github.com/AkaHarshit/Queue-Management-System.git
cd Queue-Management-System

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### Environment Setup
Create a `.env` file in the `server` directory:
```
DATABASE_URL=postgresql://user:password@host:port/database
JWT_SECRET=your_super_secret_key
PORT=3001
CORS_ORIGIN=http://localhost:5173
```

### Running the Application Locally

```bash
# Terminal 1 — Start the backend server
cd server
npm run dev
# Server runs on http://localhost:3001

# Terminal 2 — Start the frontend
cd client
npm run dev
# Client runs on http://localhost:5173
```

### Vercel Deployment
The application is pre-configured for Vercel. Simply connect your GitHub repository to Vercel, set the `DATABASE_URL` and `JWT_SECRET` environment variables in the Vercel dashboard, and deploy! The `vercel.json` file automatically routes all `/api/*` traffic to the serverless function.

### Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@queue.com | admin123 |
| Staff | staff1@queue.com | staff123 |
| Staff | staff2@queue.com | staff123 |
| Customer | john@example.com | customer123 |
| Customer | jane@example.com | customer123 |

## 📡 API Endpoints

*(API endpoints remain unchanged)*

## 📄 License

This project is for educational purposes as part of the SESD curriculum.
