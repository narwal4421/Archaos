<div align="center">
  
  # 🌌 ARCHAOS
  ### *Cinematic Distributed Systems War Room & Chaos Engineering Sandbox*

  <p align="center">
    <a href="https://nodejs.org/"><img src="https://img.shields.io/badge/node-%3E%3D20.0.0-blue.svg?style=for-the-badge&logo=node.js" alt="Node.js" /></a>
    <a href="https://nestjs.com/"><img src="https://img.shields.io/badge/backend-NestJS%2011-red.svg?style=for-the-badge&logo=nestjs" alt="NestJS" /></a>
    <a href="https://react.dev/"><img src="https://img.shields.io/badge/frontend-React%2019%20%2B%20Vite-blue.svg?style=for-the-badge&logo=react" alt="React" /></a>
    <a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/styling-Tailwind%204.0-cyan.svg?style=for-the-badge&logo=tailwindcss" alt="TailwindCSS" /></a>
    <a href="https://www.docker.com/"><img src="https://img.shields.io/badge/containers-Docker%20Compose-blue.svg?style=for-the-badge&logo=docker" alt="Docker" /></a>
    <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge" alt="License: MIT" /></a>
  </p>

  **Archaos** is an interactive, high-fidelity distributed systems topology designer, failure simulator, and AI-powered chaos engineering playground. It transforms abstract distributed systems theories—such as cascading failures, retry storms, thundering herds, and split-brain scenarios—into live, visual simulations.
</div>

---

## 1. Project Introduction

Archaos is an immersive educational and testing tool designed to help developers visualize, trace, and understand distributed system vulnerabilities. Rather than relying on simple abstract flowcharts or heavy Kubernetes-based clusters, Archaos operates on a real-time, event-driven request simulation engine.

### Why Archaos?
In traditional architectures, understanding failure modes (like cascading downstream bottlenecks or split-brain replication failures) requires either reading dry theoretical documentation or staging heavy infrastructure tests that disrupt work. Archaos bridges this gap:
*   **Systemic Clarity**: It models request packages as physical entities traversing paths on a drag-and-drop node canvas.
*   **Frictionless Execution**: Zero dependencies on real Kubernetes clusters or VMs. Runs entirely in local web workers, providing immediate feedback.
*   **Cinematic Engineering UI**: Sleek dark void theme, grid coordinate layouts, cursor dot tracers, CRT scanlines, and glow filters to capture the atmosphere of a real incident command center.

---

## 2. Feature Comparison Table

| Capability | Archaos Sandbox | Chaos Mesh / Gremlin | Static Diagrams (draw.io) |
| :--- | :--- | :--- | :--- |
| **Instant Interactive Editor** | **Yes** (Real-time visual node grid) | No (Requires Kubernetes config files) | Yes (But shapes are purely static) |
| **Request Queue Simulation** | **Yes** (Queue bounds & processing limits) | No (Focuses on container resource limits) | No |
| **Live AI Causal Analysis** | **Yes** (Streaming commentary of failure states) | No | No |
| **Multiplayer Incident Rooms** | **Yes** (Collaborative sync via Socket.io) | No | No |
| **Interactive Walkthroughs** | **Yes** (Built-in educational checkpoints) | No | No |
| **Client-Side Simulation Isolation** | **Yes** (Background HTML5 Web Worker) | No (Must execute in real environments) | N/A (No active simulation) |
| **Memory Profiling & Leaks** | **Yes** (Simulated memory drift & OOM states) | No | No |

---

## 3. Architecture Overview

Archaos is designed as a TypeScript monorepo workspace for clean segregation of interests:

```
archaos/
├── apps/
│   ├── web/                    # React 19 Frontend Web Application
│   │   ├── public/             # Static sitemaps, robots.txt, and configurations
│   │   └── src/
│   │       ├── components/     # UI layouts, Navbars, and React Flow Canvas wrappers
│   │       ├── hooks/          # React hooks (simulation managers, worker listeners)
│   │       ├── lib/            # Axios API wrappers and Supabase connection clients
│   │       ├── pages/          # Landing, Dashboard, Auth, Editor, Learn, Scenarios
│   │       ├── stores/         # Zustand state containers (Auth, Canvas, SimStates)
│   │       ├── types/          # Shared type safety constraints for Topologies & Simulators
│   │       └── workers/        # Discrete Event Loop Simulation Web Worker
│   │
│   └── api/                    # NestJS REST and WebSocket Server
│       ├── prisma/             # Schema definitions, migrations, and seeds
│       └── src/
│           ├── modules/        # Domain-driven NestJS modules
│           │   ├── auth/       # Custom JWT and Supabase sign-in/up logic
│           │   ├── topologies/ # Node & edge JSON configurations persistence
│           │   ├── scenarios/  # Pre-compiled walkthrough scenarios
│           │   ├── blast/      # Chaos blast radius modeling & log aggregators
│           │   ├── sessions/   # Multi-operator collaborative rooms
│           │   └── narration/  # OpenAI/OpenRouter WebSockets streaming gateway
│           └── main.ts         # Server entrypoint and CORS configurations
│
├── docker-compose.yml          # Container orchestration for Postgres & Redis
├── package.json                # Monorepo workspaces command manager
└── README.md                   # Project documentation
```

---

## 4. AI Capabilities

Archaos includes a live **AI Incident Narrator** that watches the active simulation canvas and explains systemic failures to users.

### How It Works:
1. **Event Capture**: When a node changes health states (e.g., transitions from `HEALTHY` to `DEGRADED` or `FAILED`) or an edge trips its circuit breaker, an event payload is dispatched.
2. **WebSocket Pipeline**: The payload is piped through the `/narration` WebSocket namespace.
3. **OpenRouter Streaming**: The backend formats a custom prompt containing the exact JSON topology and active metrics, then invokes OpenRouter's model API (`openai/gpt-oss-120b` with a failover to `moonshotai/kimi-k2.6`).
4. **Structured JSON Streaming**: The prompt instructs the model to stream back a JSON payload:
   ```json
   {
     "narration": "A detailed explanation of why Node X degraded downstream.",
     "concept": "Distributed Systems Concept (e.g. Cascading Failure)",
     "prediction": "What will fail next in 10-30 seconds if left untreated.",
     "watchFor": "Specific metric or node state to monitor"
   }
   ```
5. **Zero-API-Key Fallback**: If OpenAI/OpenRouter keys are not configured in `.env`, the gateway transparently switches to a local pattern-matching narration parser to maintain functionality.

---

## 5. Security Architecture

Archaos enforces enterprise-grade security controls:
*   **Authentication Flow**: Implements a dual approach—supports direct **Supabase Authentication** for cloud deployments, alongside a local custom **BCrypt-based JWT** login gateway for simple offline local environments.
*   **Input Sanitization**: Node specifications (replica counts, connection pools, and circuit breaker timeouts) are checked at the REST boundary using NestJS validation pipes (`class-validator` and `class-transformer`).
*   **Scoped Access Controls**: Users can write, delete, and modify only their own topologies and simulation histories. Default educational scenarios are marked as read-only built-in records.
*   **WebSockets Validation**: Socket connection requests are checked against the authorization store before joining collaborative incident rooms, preventing session spoofing.

---

## 6. Quick Start Guide

### Prerequisites
*   **Node.js**: `v20.0.0` or higher
*   **Docker**: Docker Compose command-line utilities
*   **Supabase Client**: Account keys (if saving public sessions to the cloud)

### Step-by-Step Installation

#### 1. Clone & Workspace Setup
```bash
git clone https://github.com/narwal4421/Archaos.git
cd Archaos
npm install
```

#### 2. Configure Environment Variables
Create the root `.env` configuration file:
```bash
cp .env.example .env
```
Ensure your database connections and API keys are specified inside `.env`:
```env
DATABASE_URL="postgresql://archaos_user:archaos_password@localhost:5433/archaos_db?schema=public"
REDIS_URL="redis://localhost:6380"
JWT_SECRET="generate-a-strong-32-character-secret"
OPENAI_API_KEY="sk-..."  # Provide OpenAI or OpenRouter Key
```

Create the frontend configuration file:
```bash
cp apps/web/.env.example apps/web/.env
```
Ensure client credentials match your local setup:
```env
VITE_SUPABASE_URL="https://your-supabase-id.supabase.co"
VITE_SUPABASE_ANON_KEY="your-anon-key"
```

#### 3. Boot Infrastructure Containers
Start local PostgreSQL and Redis servers using Docker:
```bash
npm run docker:up
```

#### 4. Run Migrations & Seeds
Generate Prisma schemas and seed pre-configured scenarios:
```bash
npm run build:api
npx prisma db seed
```

#### 5. Launch Development Servers
Start frontend and backend applications concurrently:
```bash
npm run dev
```
*   **Frontend Client**: [http://localhost:5173](http://localhost:5173)
*   **Backend REST/WS**: [http://localhost:5000/api](http://localhost:5000/api)

---

## 7. Tech Stack

### Monorepo Workspaces

| Layer | Package / Tool | Purpose |
| :--- | :--- | :--- |
| **Frontend (`apps/web`)** | React 19 / Vite 8 | User portal rendering core. |
| | `@xyflow/react` | Node layout graph manipulation canvas. |
| | `d3` | Dynamic calculation of edge path physics and load arrows. |
| | `framer-motion` | Smooth transition animation blocks and overlay panels. |
| | `zustand` | State manager coordinating authentication and simulations. |
| **Backend (`apps/api`)** | NestJS 11 / Express | High-performance microservices backend framework. |
| | Socket.io | Bidirectional sync of multi-operator simulation rooms. |
| | Prisma 6 | ORM matching relational PostgreSQL schemas. |
| | `ioredis` | Caching API requests and tracking active Socket clients. |
| | `openai` | Accessing OpenRouter streaming models for live narration. |

---

## 8. Core Engine Technical Details

The engine simulates requests using a client-side **Discrete Event Simulation (DES)** loop. 

```
                                [ CLIENT PRODUCER ]
                                         │
                                         ▼ (Adds Requests)
 +-----------------------------------------------------------------------------------+
 |   BACKGROUND WEB WORKER (simulation.worker.ts)                                    |
 |                                                                                   |
 |  +-----------------------+              +-----------------------+                 |
 |  |    Priority Queue     | -----------> |   Service Nodes Map   |                 |
 |  |  (Heap Sorted Times)  |              | - Tracks Queue Depth  |                 |
 |  +-----------------------+              | - CPU Saturation      |                 |
 |                                         | - Replica Processing  |                 |
 |                                         +-----------------------+                 |
 |                                                     │                             |
 |                                                     ▼                             |
 |                                         +-----------------------+                 |
 |                                         |   Edge Runtime Map    |                 |
 |                                         | - Latency / PacketLoss|                 |
 |                                         | - Circuit Breaker CB  |                 |
 |                                         +-----------------------+                 |
 +-----------------------------------------------------------------------------------+
                                         │
                                         ▼ (State Serialized & Emitted)
                                [ MAIN RENDERING THREAD ]
```

### Key Mathematical & Simulation Concepts:
1.  **Heap-Sorted Priority Queue**: Each virtual network request package is an object with an arrival timestamp:
    ```typescript
    interface RequestEvent {
      id: string;
      time: number; // Execution timestamp (ms)
      type: 'ARRIVE' | 'DEPART';
      currentNodeId: string;
      edgeHistory: string[];
    }
    ```
2.  **Backpressure Algorithm**: When downstream service CPU exceeds $90\%$, processing duration spikes. Queue depth grows toward `maxQueueDepth`. Upstream nodes calling this degraded service throttle their departure rate to prevent memory exhaustion, propagating latency back up to the API Gateway.
3.  **Circuit Breaker State Machine**:
    $$\text{Error Rate} = \frac{\text{Failed Requests in } 10\text{s}}{\text{Total Requests in } 10\text{s}} \times 100$$
    If this rate exceeds the threshold limit, the circuit transitions to `OPEN`, immediately rejecting traffic (failing fast) to protect downstream infrastructure.

---

## 9. Real-Time & Collaboration Features

Archaos collaborative rooms use **WebSockets** via `socket.io-client` and `@nestjs/platform-socket.io` to synchronize state:

*   **State Conflict Resolution**: When multiple operators modify the topology configuration (moving coordinates or configuring replicas) concurrently, actions are timestamped and resolved using a Last-Write-Wins (LWW) CRDT policy.
*   **Simultaneous Failures**: Operators can execute chaos blasts (e.g., dropping database edges) concurrently, viewing the immediate downstream impacts on each other's screens.
*   **Shared AI Narration Feed**: Live narration audio and text logs generated by the AI narrator are streamed to all operators in the session, keeping everyone on the same page.

---

## 10. Database Schema

The database is built on PostgreSQL and mapped via **Prisma ORM**.

```prisma
model User {
  id           String       @id @default(uuid())
  email        String       @unique
  passwordHash String
  name         String
  createdAt    DateTime     @default(now())
  updatedAt    DateTime     @updatedAt
  topologies   Topology[]
  sessions     SimSession[]
}

model Topology {
  id          String       @id @default(uuid())
  userId      String
  user        User         @relation(fields: [userId], references: [id])
  name        String
  description String?
  isPublic    Boolean      @default(false)
  nodesJson   Json         // Array of NodeConfig
  edgesJson   Json         // Array of EdgeConfig
  thumbnail   String?
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
  sessions    SimSession[]
}

model Scenario {
  id                String   @id @default(uuid())
  name              String
  description       String
  category          String   // CASCADE, RETRY_STORM, THUNDERING_HERD, SPLIT_BRAIN
  difficulty        String   // BEGINNER, INTERMEDIATE, ADVANCED
  nodesJson         Json
  edgesJson         Json
  chaosScript       Json     // Pre-programmed timed chaos events
  walkthroughScript Json     // Checkpoints and questions
  isBuiltIn         Boolean  @default(false)
  playCount         Int      @default(0)
  createdAt         DateTime @default(now())
}

model SimSession {
  id           String    @id @default(uuid())
  userId       String
  user         User      @relation(fields: [userId], references: [id])
  topologyId   String?
  topology     Topology? @relation(fields: [topologyId], references: [id])
  scenarioId   String?
  durationSecs Int       @default(0)
  chaosEvents  Json
  maxErrorRate Float     @default(0)
  nodesKilled  Int       @default(0)
  createdAt    DateTime  @default(now())
}
```

---

## 11. Available Scripts

Run commands from the root repository directory:

| Command | Target Directory | Purpose |
| :--- | :--- | :--- |
| `npm run dev` | Root Monorepo | Spins up the Vite client and NestJS server concurrently. |
| `npm run dev:web` | `apps/web` | Launches Vite on port 5173 in dev mode. |
| `npm run dev:api` | `apps/api` | Launches NestJS server in watch mode. |
| `npm run build` | Root Monorepo | Compiles both API and Web code for production. |
| `npm run docker:up` | Root Monorepo | Boots postgres (5433) and redis (6380) locally. |
| `npm run docker:down`| Root Monorepo | Shuts down database and cache containers. |
| `npx prisma migrate dev` | `apps/api` | Runs migration commands to sync local database. |
| `npx prisma db seed` | `apps/api` | Populates database with default system scenarios. |

---

## 12. Deployment Guide

### Infrastructure Setup
1.  **Database & Redis Cache**: Provision a PostgreSQL v16 and a Redis v7 instance on a cloud provider like **Railway** or **Render**.
2.  **Supabase Auth (Optional)**: If you're using Supabase for user authentication, set up a new project in the Supabase dashboard and note down your API keys.

### Backend Deployment (Railway)
1. Link your GitHub repository to **Railway**.
2. Add a new service from your repository, and set the root directory to `apps/api`.
3. Configure your Environment Variables:
   *   `DATABASE_URL`: Set to your Postgres connection string.
   *   `REDIS_URL`: Set to your Redis connection string.
   *   `JWT_SECRET`: Set to your JWT secret.
   *   `OPENAI_API_KEY`: Set to your OpenAI key.
4. Set the build command to `npm run build:api` and start command to `npm run start:prod`.

### Frontend Deployment (Vercel)
1. Import your project repository into **Vercel**.
2. Set the root directory to `apps/web`.
3. Add the following build command overrides:
   *   **Build Command**: `tsc -b && vite build`
   *   **Output Directory**: `dist`
4. Set the frontend Environment Variables:
   *   `VITE_SUPABASE_URL`: Set to your Supabase project URL.
   *   `VITE_SUPABASE_ANON_KEY`: Set to your Supabase anonymous key.
5. Deploy the application.

---

## 13. API Documentation

REST endpoints are exposed on `http://localhost:5000/api`.

### Key Endpoints:
*   `GET /api` - **Health Check**: Handshake endpoint returning server health.
*   `POST /api/auth/register` - Create user accounts.
*   `POST /api/auth/login` - Authenticate users and retrieve JWT tokens.
*   `GET /api/topologies` - Retrieve public or user-scoped custom topologies.
*   `POST /api/topologies` - Save new system topologies (nodes, edges configurations).
*   `GET /api/scenarios` - Retrieve list of available system scenario walkthroughs.
*   `POST /api/sessions` - Register logs for completed simulation session runs.

---

## 14. Full Feature Checklist

- [x] **Cinematic Frontend Canvas**
  - [x] Interactive nodes drag-and-drop system.
  - [x] Edge flow metrics overlay (RPS, errors, latency).
  - [x] Custom Cursor Dot & Glow interactions.
  - [x] CRT screen scanlines and noise visual effects.
- [x] **Resilience Simulation Engine**
  - [x] Dedicated Web Worker thread isolation.
  - [x] Dynamic sliding-window circuit breaker.
  - [x] Backpressure and queue saturation delays.
  - [x] Cache-miss thundering herd dynamics.
- [x] **Interactive Scenario Room**
  - [x] Guided interactive checkpoints with quiz questions.
  - [x] Score updates and category classification.
- [x] **AI Narration Core**
  - [x] OpenAI / OpenRouter streaming completions.
  - [x] Concept identifier and predictive watch metrics.
- [x] **Collaborative Workspace**
  - [x] Socket.io rooms state synchronization.
  - [x] Multi-operator simulation inputs.
- [x] **System Analytics Panel**
  - [x] High-performance system-wide sparklines (Total RPS, Error Rate, p99 Latency).
  - [x] Per-node live breakdown table (Memory usage, CPU saturation, Queue Depth).

---

## 15. Contributing Guide

1. Fork the repository on GitHub.
2. Clone the fork locally:
   ```bash
   git clone https://github.com/your-username/Archaos.git
   ```
3. Create a branch for your feature:
   ```bash
   git checkout -b feat/my-amazing-feature
   ```
4. Write clean, modular, and type-safe code. Add comments for complex routing mathematics.
5. Commit your changes:
   ```bash
   git commit -m "feat: add sliding window latency metrics to UI panel"
   ```
6. Push to your branch and open a Pull Request.

---

## 16. License

Distributed under the MIT License. See `LICENSE` for more information.
