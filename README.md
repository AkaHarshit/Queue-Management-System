# QueueFlow — Queue Management System

A comprehensive Queue Management System designed for **Salons** and **Hospitals** to efficiently manage customer/patient queues, reduce waiting times, and improve service delivery through digital token-based queuing.

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
- WebSocket-based live updates (Observer Pattern)
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
| **Strategy** | `INotificationStrategy` → `WebSocketNotificationStrategy`, `InAppNotificationStrategy` |
| **Observer** | `WebSocketServer` for real-time broadcast to clients |

### SOLID Principles
- **SRP** — Each class has a single responsibility (controllers, services, repositories)
- **OCP** — New notification channels via Strategy Pattern without modifying existing code
- **LSP** — `Customer`, `Staff`, `Admin` extend `User` and are fully substitutable
- **ISP** — Repository interfaces split into `IReadRepository` and `IWriteRepository`
- **DIP** — Services depend on repository interfaces, not concrete implementations

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js + TypeScript
- **Framework**: Express.js
- **Database**: SQLite (via `better-sqlite3`)
- **Auth**: JWT (JSON Web Tokens) + bcryptjs
- **Real-time**: Socket.IO (WebSocket)

### Frontend
- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite
- **Styling**: Vanilla CSS (custom design system)
- **Real-time**: Socket.IO Client

## 📁 Project Structure

```
├── server/
│   └── src/
│       ├── config/          # Singleton configs (database, app settings)
│       ├── controllers/     # REST API controllers
│       ├── factories/       # Factory pattern (TokenFactory)
│       ├── interfaces/      # TypeScript interfaces (ISP)
│       ├── middleware/      # Auth & role-based middleware
│       ├── models/          # Domain models (User, Token, Service, etc.)
│       ├── repositories/    # Data access layer (Repository Pattern)
│       ├── routes/          # Express route definitions
│       ├── services/        # Business logic layer
│       ├── strategies/      # Notification strategies (Strategy Pattern)
│       ├── websocket/       # WebSocket server (Observer Pattern)
│       └── index.ts         # Application bootstrap & DI wiring
├── client/
│   └── src/
│       ├── components/      # React components (auth, dashboards, common)
│       ├── context/         # React Context (AuthContext)
│       ├── hooks/           # Custom hooks (useWebSocket)
│       ├── services/        # API client service
│       └── types/           # TypeScript type definitions
├── ErDiagram.md             # Entity-Relationship diagram
├── classDiagram.md          # UML class diagram
├── sequenceDiagram.md       # Sequence diagrams
└── useCaseDiagram.md        # Use case diagrams
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm

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

### Running the Application

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

### Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@queue.com | admin123 |
| Staff | staff1@queue.com | staff123 |
| Staff | staff2@queue.com | staff123 |
| Customer | john@example.com | customer123 |
| Customer | jane@example.com | customer123 |

## 📐 UML Diagrams

- **ER Diagram** — Database schema with all tables and relationships
- **Class Diagram** — OOP class hierarchy showing SOLID patterns
- **Sequence Diagrams** — Flow for join queue, complete service, notifications
- **Use Case Diagram** — Actor-use case mappings for all roles

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |

### Queue Management
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/queue/join` | Customer | Join a queue |
| GET | `/api/queue/my-tokens` | Customer | Get my tokens |
| DELETE | `/api/queue/token/:id` | Customer | Cancel token |
| GET | `/api/queue/token/:id/status` | All | Get token status |
| GET | `/api/queue/staff/tokens` | Staff | Get assigned tokens |
| PUT | `/api/queue/token/:id/start` | Staff | Start service |
| PUT | `/api/queue/token/:id/complete` | Staff | Complete service |
| GET | `/api/queue/all` | Admin | Monitor all queues |

### Services
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/services` | Public | List all services |
| GET | `/api/services/active` | Public | List active services |
| POST | `/api/services` | Admin | Create service |
| PUT | `/api/services/:id` | Admin | Update service |
| DELETE | `/api/services/:id` | Admin | Delete service |

### Users
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/users/me` | All | Get current user |
| GET | `/api/users` | Admin | List all users |
| DELETE | `/api/users/:id` | Admin | Delete user |

### Analytics
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/analytics/dashboard` | Admin | Dashboard stats |
| GET | `/api/analytics/services` | Admin/Staff | Service statistics |

### Notifications
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/notifications` | All | Get notifications |
| GET | `/api/notifications/unread` | All | Get unread notifications |
| PUT | `/api/notifications/:id/read` | All | Mark as read |
| PUT | `/api/notifications/read-all` | All | Mark all as read |

## 🔧 Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | Server port |
| `JWT_SECRET` | `queue-management-secret-key-2024` | JWT signing secret |
| `JWT_EXPIRES_IN` | `24h` | Token expiration |
| `CORS_ORIGIN` | `http://localhost:5173` | Allowed CORS origin |

## 📄 License

This project is for educational purposes as part of the SESD curriculum.
