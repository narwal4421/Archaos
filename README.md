# 🌌 ARCHAOS: Cinematic Distributed Systems War Room & Chaos Simulator

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.0.0-blue.svg)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![NestJS](https://img.shields.io/badge/backend-NestJS%2011-red.svg)](https://nestjs.com/)
[![React](https://img.shields.io/badge/frontend-React%2019%20%2B%20Vite-blue.svg)](https://react.dev/)
[![TailwindCSS](https://img.shields.io/badge/styling-Tailwind%204.0-cyan.svg)](https://tailwindcss.com/)
[![Docker](https://img.shields.io/badge/containers-Docker%20Compose-blue.svg)](https://www.docker.com/)

**Archaos** is an interactive, high-fidelity distributed systems topology designer, failure simulator, and AI-powered chaos engineering playground. It transforms abstract distributed systems theories—such as cascading failures, retry storms, thundering herds, and split-brain scenarios—into live, visual simulations. Designed with a premium cinematic aesthetic, it serves as a visual "war room" for engineers to design architectures, inject chaos, and learn how to build resilient systems.

### What Makes Archaos Different?
Unlike standard infrastructure visualizers (like Excalidraw or draw.io) which are purely static, or cloud-native chaos engineering platforms (like Chaos Mesh or Gremlin) which operate on real Kubernetes clusters and require complex orchestration, **Archaos** merges both worlds into a lightweight, instant-feedback sandbox:
*   **Request-Level Accuracy**: It simulates real network calls propagation, queue backpressure, CDN caching, and database connection pools.
*   **Dedicated Execution Sandbox**: Simulating millions of requests on the client-side using a fast, non-blocking Web Worker.
*   **AI-Powered Explainers**: Real-time narration detailing *why* the failure cascades and predicting the blast radius.

---

## 2. Feature Comparison Table

| Capability | Archaos Sandbox | Chaos Mesh / Gremlin | Static Diagrams (draw.io) |
| :--- | :--- | :--- | :--- |
| **Instant Interactive Editor** | **Yes** (Drag-and-drop nodes & edges) | No (Configured via YAML/CRDs) | Yes (But static shapes only) |
| **Real-time Queue Simulation**| **Yes** (Queue bounds, backpressure) | No (Stresses system resource level) | No |
| **AI Narrative & Predictions**  | **Yes** (Streaming causal analysis) | No | No |
| **Multiplayer Incident Rooms** | **Yes** (Live Socket.io collaborative war rooms) | No | No |
| **Guided Educational Scenarios** | **Yes** (Quizzes & interactive milestones) | No | No |
| **Setup Overhead** | **None** (Runs instantly, optional DB) | High (Requires Kubernetes clusters) | None |

---

## 3. Architecture Overview

Archaos is structured as a monorepo workspace for clean segregation of frontend, backend, and database configurations.

```
archaos/
├── apps/
│   ├── web/                    # Frontend React Application
│   │   ├── public/             # Static files, sitemaps, robots.txt
│   │   └── src/
│   │       ├── components/     # UI components, layout, and Canvas wrapper
│   │       ├── hooks/          # React hooks (e.g., simulation manager)
│   │       ├── lib/            # Axios API client, Supabase configs
│   │       ├── pages/          # Landing, Dashboard, Auth, Editor, Learn, Scenarios
│   │       ├── stores/         # Zustand state stores (auth, canvas, simulation)
│   │       ├── types/          # Topology and simulation type definitions
│   │       └── workers/        # Web Worker simulation engine (isolated runtimes)
│   │
│   └── api/                    # Backend NestJS HTTP and WebSocket Server
│       ├── prisma/             # Schema definition, migrations, and seeds
│       └── src/
│           ├── modules/        # Domain-driven NestJS modules
│           │   ├── auth/       # Custom JWT and Supabase sign-in/up logic
│           │   ├── blast/      # Chaos blast radius modeling & logs
│           │   ├── narration/  # OpenAI/OpenRouter WebSockets streamer
│           │   ├── scenarios/  # Built-in scenarios store & play counters
│           │   ├── sessions/   # Multi-operator collaborative workspaces
│           │   └── topologies/ # Node & edge JSON configurations persistence
│           └── main.ts         # Server entrypoint and CORS declarations
│
├── docker-compose.yml          # Container configuration for Postgres & Redis
├── package.json                # Monorepo workspaces command hub
└── README.md                   # Project documentation
```

---

## 4. AI Capabilities

Archaos includes a live **AI Narrator** that acts as a co-pilot during incident response. 

### How It Works:
1. When a failure is injected (e.g., Latency Injection) or a node shifts state (e.g., Circuit Breaker Trips), the simulation engine generates a structured event payload.
2. The event, current topology metadata, and real-time state metrics are transmitted to the NestJS backend via WebSockets (`narration` namespace).
3. The backend makes a streaming call to the **OpenRouter API** using a primary model (`openai/gpt-oss-120b`) with a fallback model (`moonshotai/kimi-k2.6`) if the primary is slow or rate-limited.
4. The AI streams a JSON object back, containing:
    *   `narration`: A 2-3 sentence explanation of the specific cause of the failure.
    *   `concept`: The canonical name of the distributed systems concept (e.g., *Cascading Failure*, *Retry Storm*, *Backpressure*).
    *   `prediction`: A predictive forecast of what will happen next and when.
    *   `watchFor`: The specific metric (e.g., p99 latency, queue depth) the user should watch to verify the prediction.
5. If the AI API keys are missing, the gateway automatically falls back to an offline pattern-matching simulator to ensure a seamless UX.

---

## 5. Security Architecture

Archaos ensures secure multiplayer collaborations and safe user custom topology management:

*   **Authentication & Authorization**: Integrated with Supabase Auth or custom BCrypt-hashed password matching stored in PostgreSQL. Validated through JWT-bearer tokens in NestJS Guards.
*   **WebSocket Validation**: Collaborative room joins (`sessions`) validate JWT tokens before assigning write-capabilities.
*   **Input Sanitization**: Node configurations (edges timeouts, retry bounds, pool sizes) are strongly typed and validated at the API boundary using NestJS `ValidationPipe` with `class-validator`.
*   **Database Isolation**: Users can only modify or delete topologies they created. Public topologies are read-only templates.
*   **Rate Limiting**: Configured at the API gateway layer to prevent denial of service from excessive simulation starts.

---

## 6. Quick Start Guide

### Prerequisites
*   [Node.js](https://nodejs.org/) v20+
*   [Docker](https://www.docker.com/) & Docker Compose
*   *Optional*: OpenAI/OpenRouter API key for live AI commentary

### Step-by-Step Installation

#### 1. Clone & Install Workspace
```bash
git clone https://github.com/narwal4421/Archaos.git
cd Archaos
npm install
```

#### 2. Set Up Environment Variables
Create the root `.env` configuration file:
```bash
cp .env.example .env
```
Update the variables inside `.env`:
```env
DATABASE_URL="postgresql://archaos_user:archaos_password@localhost:5433/archaos_db?schema=public"
REDIS_URL="redis://localhost:6380"
JWT_SECRET="use-a-secure-random-phrase-here"
OPENAI_API_KEY="sk-..."  # Provide your OpenAI/OpenRouter key
```

Create the frontend configuration file:
```bash
cp apps/web/.env.example apps/web/.env
```
Update `apps/web/.env`:
```env
VITE_SUPABASE_URL="https://your-supabase-id.supabase.co"
VITE_SUPABASE_ANON_KEY="your-anon-key"
```

#### 3. Spin Up Infrastructure Containers
Launch PostgreSQL and Redis in the background:
```bash
npm run docker:up
```

#### 4. Run Migrations & Database Seeds
Generate the Prisma client, migrate schemas, and seed scenarios:
```bash
npm run build:api
npx prisma db seed
```

#### 5. Launch the Monorepo
Start both the React web application and NestJS backend concurrently:
```bash
npm run dev
```
*   **Web Portal**: [http://localhost:5173](http://localhost:5173)
*   **API Server**: [http://localhost:5000/api](http://localhost:5000/api)

---

## 7. Tech Stack

| Workspace | Technology / Package | Purpose |
| :--- | :--- | :--- |
| **Frontend (`apps/web`)** | React 19 / TypeScript / Vite 8 | Core user interface framework. |
| | `@xyflow/react` | Visual workspace graph rendering and node manipulation. |
| | `d3` | Graph positioning math and animation coordinates. |
| | `framer-motion` | Smooth transition overlays and dashboard animations. |
| | `zustand` | Store configuration for topology and session sync. |
| **Backend (`apps/api`)** | NestJS 11 / Node | Scalable server API and WebSocket engine. |
| | Socket.io | Real-time synchronization of shared incident rooms. |
| | Prisma 6 | Type-safe database queries and migrations. |
| | `ioredis` | Caching server actions and tracking WebSocket active connections. |
| | `openai` | Access OpenRouter streaming models for incident narration. |

---

## 8. Core Engine Technical Details

The heartbeat of Archaos is its client-side **Simulation Engine**. Running simulations in the main UI thread causes input lag and halts graph animations. Archaos solves this by decoupling rendering from computation using an isolated **HTML5 Web Worker**.

```
+-------------------------------------------------------------+
|                        MAIN THREAD                          |
|  [React Web Canvas] <======== (Updates: Queue, CPU, Errors) -+
|         ||                                                  |
|  (User Action: Inject Latency)                              |
|         ||                                                  |
+---------||--------------------------------------------------+
          ||  [PostMessage API]
+---------||--------------------------------------------------+
|         \/                                                  |
|    WEB WORKER (simulation.worker.ts)                        |
|                                                             |
|  +-------------------------------------------------------+  |
|  |                Discrete Event Loop                    |  |
|  |  1. Pulls incoming requests from client generator.    |  |
|  |  2. Propagates requests downstream using Edge latency. |  |
|  |  3. Manages per-service queue counts & processing.     |  |
|  |  4. Calculates sliding-window error rates (10s).      |  |
|  |  5. Evaluates circuit breaker states.                 |  |
|  |  6. Updates CPU saturation and backpressure logic.    |  |
|  +-------------------------------------------------------+  |
+-------------------------------------------------------------+
```

### Key Simulation Models Implemented:
*   **Sliding-Window Circuit Breakers**: Trips open when failure rates exceed configurable thresholds within a rolling 10-second window. Transitions back to half-open, sending probe requests, before closing.
*   **Queue Backpressure**: When a node is processing slowly or its queue fills up, it throttles the throughput of incoming edges, causing upstream services to accumulate requests.
*   **Thundering Herd Simulation**: When cache nodes expire, request routing bypasses cache buffers and hits database pool limits directly, causing DB connection exhaustion.

---

## 9. Real-Time & Collaboration Features

Archaos features collaborative incident-response rooms. Leveraging **Socket.io**, multiple operators can join the same simulation room.

*   **Multiplayer Workspace Sync**: Any changes made by an operator—adding a node, altering an edge timeout, or starting a simulation—are broadcast instantly to all other users in the room.
*   **Collaborative Chaos Injection**: Operators can cooperatively trigger failures (e.g. CPU spikes) and coordinate remediation (e.g. scaling replicas or resetting circuit breakers) in real-time.
*   **Coordinated AI Narration**: The AI narration stream is broadcasted to all participants in the session, keeping all operators aligned.

---

## 10. Database Schema

The database is schema-managed using **Prisma** with a PostgreSQL connector.

```mermaid
erDiagram
    User ||--o{ Topology : "creates"
    User ||--o{ SimSession : "runs"
    Topology ||--o{ SimSession : "simulates"

    User {
        String id PK
        String email UNIQUE
        String passwordHash
        String name
        DateTime createdAt
        DateTime updatedAt
    }

    Topology {
        String id PK
        String userId FK
        String name
        String description
        Boolean isPublic
        Json nodesJson
        Json edgesJson
        String thumbnail
        DateTime createdAt
        DateTime updatedAt
    }

    Scenario {
        String id PK
        String name
        String description
        String category
        String difficulty
        Json nodesJson
        Json edgesJson
        Json chaosScript
        Json walkthroughScript
        Boolean isBuiltIn
        Int playCount
        DateTime createdAt
    }

    SimSession {
        String id PK
        String userId FK
        String topologyId FK
        String scenarioId
        Int durationSecs
        Json chaosEvents
        Float maxErrorRate
        Int nodesKilled
        DateTime createdAt
    }
```

---

## 11. Available Scripts

All workspace operations are run from the root repository directory:

| Command | Workspace Scope | Description |
| :--- | :--- | :--- |
| `npm run dev` | Monorepo root | Launches React Vite server and NestJS API server concurrently. |
| `npm run dev:web` | `apps/web` | Starts Vite dev server (port 5173). |
| `npm run dev:api` | `apps/api` | Starts NestJS dev server in watch-mode (port 5000). |
| `npm run build` | Monorepo root | Compiles NestJS backend code and builds frontend assets. |
| `npm run docker:up` | Infrastructure | Launches PostgreSQL (port 5433) and Redis (port 6380) Docker containers. |
| `npm run docker:down`| Infrastructure | Shuts down database and cache containers, preserving volumes. |
| `npx prisma db seed` | `apps/api` | Seeds default scenarios (Cascade, Retry Storm, etc.) into PostgreSQL. |

---

## 12. Deployment Guide

### Backend & Database (Railway Recommendation)
1. In Railway, create a new project and add **PostgreSQL** and **Redis** services.
2. Link your GitHub repository.
3. Configure the following environment variables:
    *   `DATABASE_URL`: Linked from your Postgres plugin.
    *   `REDIS_URL`: Linked from your Redis plugin.
    *   `JWT_SECRET`: Generate a secure string.
    *   `OPENAI_API_KEY`: Add your key.
4. Set build command: `npm run build:api` and start command: `npm run start:prod`.

### Frontend Portal (Vercel Recommendation)
1. Link your repo in Vercel.
2. Configure Root Directory to `apps/web`.
3. Set the Environment Variables:
    *   `VITE_SUPABASE_URL`: Point to your Supabase project.
    *   `VITE_SUPABASE_ANON_KEY`: Supabase anon key.
4. Vercel automatically detects the Vite config and deploys.

---

## 13. API Documentation

### Accessing APIs
Once the server is running, the HTTP routes are mounted under `/api`:
*   **Health Check Endpoint**: `GET http://localhost:5000/api` - Returns a `200 OK` handshake string from the application server.
*   **Auth Module**: `POST /api/auth/login`, `POST /api/auth/register`
*   **Topology Storage**: `GET /api/topologies`, `POST /api/topologies`
*   **Scenarios**: `GET /api/scenarios`, `GET /api/scenarios/:id`

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

---

## 15. Contributing Guide

1. **Fork** the repository to your own GitHub account.
2. **Clone** it locally and establish the upstream remote configuration.
3. Create a **branch** for your feature:
   ```bash
   git checkout -b feature/amazing-feature
   ```
4. Write clean, modular, and type-safe code. Add comments for complex routing mathematics.
5. **Commit** using standard semantic naming conventions:
   ```bash
   git commit -m "feat: add sliding window latency metrics to UI panel"
   ```
6. **Push** to your remote fork and open a **Pull Request** targeting the `main` branch.

---

## 16. License

Distributed under the MIT License. See `LICENSE` for more information.
