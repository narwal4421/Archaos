# 🌌 ARCHAOS: Cinematic Distributed Systems War Room & Chaos Simulator

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.0.0-blue.svg)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![NestJS](https://img.shields.io/badge/backend-NestJS%2011-red.svg)](https://nestjs.com/)
[![React](https://img.shields.io/badge/frontend-React%2019%20%2B%20Vite-blue.svg)](https://react.dev/)
[![TailwindCSS](https://img.shields.io/badge/styling-Tailwind%204.0-cyan.svg)](https://tailwindcss.com/)
[![Docker](https://img.shields.io/badge/containers-Docker%20Compose-blue.svg)](https://www.docker.com/)

**Archaos** is an interactive, high-fidelity distributed systems topology designer, failure simulator, and AI-powered chaos engineering playground. It transforms abstract distributed systems theories—such as cascading failures, retry storms, thundering herds, and split-brain scenarios—into live, visual simulations. Designed with a premium cinematic aesthetic, it serves as a visual "war room" for engineers to design architectures, inject chaos, and learn how to build resilient systems.

---

## 🚀 Key Features

*   **Interactive Visual Topology Builder**: Drag-and-drop services, databases, caches, and API gateways using `@xyflow/react` and `d3`. Configure parameters like timeout latency, max retries, connection pools, and circuit breakers.
*   **High-Fidelity Simulation Engine**: Powered by a dedicated Web Worker running real-time request-level queueing theory, latency propagation, and failure cascading.
*   **Interactive Scenario Library**: Hands-on educational modules (e.g. *The Cascade*, *Graceful Degradation*, *The Retry Storm*, *The Thundering Herd*, *Split Brain*) with interactive quizzes that test your intuition during failure states.
*   **Real-time AI Narrator & Predictor**: Uses OpenAI (or Moonshot AI) via OpenRouter to analyze the live simulation state and stream down causal explanations, resilience predictions, and suggested metrics to watch.
*   **Multiplayer Collaborative Sessions**: Real-time room synchronization using NestJS WebSockets (`socket.io`) for multi-operator incident response drills.
*   **Supabase Authentication & Persistence**: Secure logins, user dashboards, and custom scenario sharing/saving.

---

## 📐 System Architecture

Archaos is built as a high-performance monorepo separated into two main applications:

```mermaid
graph TD
    subgraph Client [Client - apps/web]
        UI[React 19 / Vite / Tailwind]
        Worker[Web Worker - Simulation Engine]
        Store[Zustand - State Management]
        UI <--> Store
        Store <--> Worker
    end

    subgraph Backend [Backend - apps/api]
        Nest[NestJS Gateway & Controllers]
        Prisma[Prisma ORM]
        Socket[Socket.io - Realtime Sync]
        Nest --> Prisma
        Nest --> Socket
    end

    subgraph Infrastructure
        DB[(PostgreSQL)]
        Cache[(Redis Cache)]
        AI[OpenAI / OpenRouter API]
    end

    UI <-- HTTP / REST --> Nest
    Store <-- WebSockets --> Socket
    Prisma --> DB
    Nest --> Cache
    Nest --> AI
```

---

## 🛠️ Tech Stack

### Frontend (`apps/web`)
*   **Core**: React 19, TypeScript, Vite 8
*   **Topology Graph**: `@xyflow/react` (React Flow), `d3` (layout and visualizations)
*   **Animations**: `framer-motion` for smooth, cinematic transitions
*   **State Management**: `zustand` for predictable global states
*   **Authentication**: `@supabase/supabase-js`
*   **Background Processing**: HTML5 Web Workers for simulation execution

### Backend (`apps/api`)
*   **Core**: NestJS 11, TypeScript
*   **Database ORM**: Prisma 6 (PostgreSQL)
*   **Real-time Communication**: `@nestjs/websockets` / `socket.io`
*   **Caching & Coordination**: `ioredis`
*   **AI Integration**: `openai` (configured with OpenRouter fallback)

---

## ⚡ Getting Started

Follow these steps to run Archaos locally on your system.

### Prerequisites
*   [Node.js](https://nodejs.org/) (v20 or higher recommended)
*   [Docker](https://www.docker.com/) (for running database & Redis)
*   [Supabase account](https://supabase.com/) (for auth keys, or use local keys)

---

### Step 1: Clone and Install Dependencies

```bash
# Clone the repository
git clone https://github.com/yourusername/archaos.git
cd archaos

# Install dependencies for the monorepo workspace
npm install
```

---

### Step 2: Set Up Environment Variables

Copy the example environment files and update them with your credentials.

**Root / Backend Environment:**
```bash
cp .env.example .env
```
Open `.env` and fill in the values:
```env
# Database & Redis URLs (configured for local docker containers below)
DATABASE_URL="postgresql://archaos_user:archaos_password@localhost:5433/archaos_db?schema=public"
REDIS_URL="redis://localhost:6380"

# JWT Secret
JWT_SECRET="generate-a-strong-random-secret"

# Supabase Configurations
SUPABASE_URL="https://your-supabase-project.supabase.co"
SUPABASE_ANON_KEY="your-anon-key"

# OpenAI or OpenRouter Keys (for AI Narration)
OPENAI_API_KEY="your-api-key"
```

**Frontend Environment:**
```bash
cp apps/web/.env.example apps/web/.env
```
Open `apps/web/.env` and enter your Supabase client settings:
```env
VITE_SUPABASE_URL="https://your-supabase-project.supabase.co"
VITE_SUPABASE_ANON_KEY="your-anon-key"
```

---

### Step 3: Spin Up PostgreSQL and Redis

Start the containerized database and cache services using Docker Compose:

```bash
# Spin up services in detached mode
npm run docker:up
```

---

### Step 4: Run Migrations and Seed Scenarios

Set up the database schema and load the default interactive scenarios:

```bash
# Generate Prisma Client and deploy migrations
npm run build:api

# Seed the database
npx prisma db seed
```

---

### Step 5: Start Development Server

Run both the frontend and backend concurrently:

```bash
npm run dev
```

*   **Frontend**: Available at [http://localhost:5173](http://localhost:5173)
*   **Backend API**: Running on [http://localhost:5000](http://localhost:5000)

---

## 🌪️ Chaos Injections Supported

Archaos lets you simulate actual architectural vulnerabilities:

| Failure Type | Target | Description | Expected Impact |
| :--- | :--- | :--- | :--- |
| **Latency Injection** | Edges / DB Links | Delays network calls by a set value in milliseconds. | Triggers thread pool exhaustion; tests circuit breakers. |
| **CPU Spike** | Microservices | Simulates a compute overload on specific nodes. | Causes request queues to grow and connections to drop. |
| **Cache Expiration** | Databases / Caches | Expires cache keys under heavy traffic load. | Triggers Thundering Herd; database pool exhaustion. |
| **Network Partition** | Database Replicas | Disrupts connection links between nodes. | Triggers Split Brain state; tests leader election. |

---

## 🤝 Contributing

We welcome contributions to Archaos! To add features, fix bugs, or create new interactive scenarios:

1. Fork the Project.
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`).
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the Branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
