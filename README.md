<div align="center">

# ⚡ ARCHAOS

### *Distributed Systems Chaos Engineering Simulator*

**The only chaos engineering platform where you build, break, and understand distributed systems — visually.**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![NestJS](https://img.shields.io/badge/NestJS-11-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://docs.docker.com/compose/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](./LICENSE)

<br/>

> **Archaos** is a full-stack, browser-based chaos engineering workbench.  
> Drag nodes onto a canvas, wire them together, inject CPU spikes, network partitions,  
> memory leaks, and cascading failures — then watch the simulation tick in real-time  
> inside a Web Worker while live telemetry streams to every metric panel.  
> **No cloud bill. No agents. No YAML sprawl. Just understanding.**

<br/>

[🚀 Live Demo](https://archaos-tau.vercel.app/) ·  · [🐛 Report Bug](https://github.com/narwal4421/Archaos/issues) · [✨ Request Feature](https://github.com/narwal4421/Archaos/issues)

</div>

---

## 📸 What Makes Archaos Different

| Capability | Archaos | Chaos Monkey | Gremlin | Litmus |
|---|:---:|:---:|:---:|:---:|
| Browser-based — zero install | ✅ | ❌ | ❌ | ❌ |
| Visual drag-and-drop topology builder | ✅ | ❌ | ❌ | ❌ |
| Real-time simulation engine (Web Worker) | ✅ | ❌ | ❌ | ❌ |
| Import Docker Compose / K8s / Terraform | ✅ | ❌ | ❌ | ⚠️ |
| Custom YAML chaos scripting timeline | ✅ | ❌ | ✅ | ✅ |
| AI narration & prediction checkpoints | ✅ | ❌ | ❌ | ❌ |
| Blast radius analysis (upstream graph walk) | ✅ | ❌ | ❌ | ⚠️ |
| Community scenario marketplace + upvoting | ✅ | ❌ | ❌ | ❌ |
| Headless REST API + CLI for CI pipelines | ✅ | ❌ | ✅ | ✅ |
| Circuit-breaker & retry simulation | ✅ | ❌ | ✅ | ⚠️ |
| Version diff (topology checkpoints) | ✅ | ❌ | ❌ | ❌ |
| Free & open-source | ✅ | ✅ | ❌ | ✅ |

---

## ✨ Feature Highlights

- 🎨 **Visual Canvas Editor** — Drag, wire, and configure any distributed system topology
- ⚡ **Real-Time Simulation Engine** — Off-thread Web Worker runs a discrete-event priority queue at 250ms ticks
- 💥 **Chaos Injection** — Kill nodes, spike CPU/memory, partition networks, add latency, trigger retry storms
- 🔁 **Circuit Breaker Simulation** — Toggle per-edge, watch the state machine transition CLOSED → OPEN → HALF-OPEN
- 📜 **Custom YAML Chaos Scripts** — Write multi-step failure sequences on a timeline; execute them with one click
- 🏗️ **Infrastructure Import** — Paste `docker-compose.yml`, Kubernetes manifests, or Terraform HCL → auto-generate topology with dagre-style auto-layout
- 🧠 **AI Narration** — GPT-powered real-time commentary explains what's happening and why (OpenAI / OpenRouter)
- 🎯 **Blast Radius Analysis** — Walk the upstream dependency graph and highlight the full failure blast zone
- 🌐 **Scenario Marketplace** — 8 built-in war-game scenarios + community-contributed blueprints with upvoting
- 🔗 **Share Topology** — Publish and share scenarios with the community
- 📊 **Live Telemetry** — p99 latency, RPS, error rate, CPU%, memory%, queue depth — all live on canvas
- 🗂️ **Version History & Diff** — Save topology checkpoints (v1/v2/v3), see a visual diff of what changed
- 🖥️ **Headless API + CLI** — `POST /run-headless` + `bin/cli.js` for CI pipeline integration
- ☁️ **Cloud Blueprint Templates** — AWS 3-Tier, Netflix Microservices, Uber Dispatch Stack — load in one click
- 📚 **Learn Center** — Interactive lessons on CAP theorem, retry storms, thundering herd, memory leaks
- 🌙 **Dark-first premium UI** — Custom cursor, glitch effects, animated mesh grids, glassmorphism panels

---

## 🏗️ Architecture Overview

```
archaos/                          ← Monorepo root (npm workspaces)
│
├── apps/
│   ├── web/                      ← React + Vite frontend (SPA)
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── canvas/       ← Canvas node/edge rendering, modals, toolbars
│   │   │   │   │   ├── ChaosScriptEditor.tsx   ← YAML timeline chaos editor
│   │   │   │   │   ├── ShareScenarioModal.tsx  ← Community publish & share
│   │   │   │   │   └── ...
│   │   │   │   └── layout/       ← Navbar, shared chrome
│   │   │   ├── hooks/            ← useSimulation, useCanvas, useAuth
│   │   │   ├── lib/
│   │   │   │   ├── api.ts        ← Typed API client (fetch wrapper)
│   │   │   │   └── infrastructureParser.ts   ← Docker/K8s/Terraform → topology
│   │   │   ├── pages/
│   │   │   │   ├── Landing.tsx   ← Animated marketing homepage
│   │   │   │   ├── Auth.tsx      ← Sign in / Sign up
│   │   │   │   ├── Dashboard.tsx ← Session history, saved topologies
│   │   │   │   ├── Editor.tsx    ← Main chaos engineering workbench
│   │   │   │   ├── Scenarios.tsx ← Community scenario marketplace
│   │   │   │   └── Learn.tsx     ← Interactive education center
│   │   │   ├── stores/           ← Zustand stores (auth, simulation)
│   │   │   ├── types/            ← topology.ts, simulation.ts shared types
│   │   │   └── workers/
│   │   │       └── simulation.worker.ts  ← Off-thread discrete-event engine
│   │   └── public/
│   │       └── sitemap.xml
│   │
│   └── api/                      ← NestJS backend REST API
│       ├── src/
│       │   ├── modules/
│       │   │   ├── auth/         ← JWT auth, bcrypt, passport strategy
│       │   │   ├── topologies/   ← CRUD for saved topology graphs
│       │   │   ├── scenarios/    ← Scenario catalog + upvoting
│       │   │   ├── sessions/     ← Simulation session records
│       │   │   ├── blast/        ← Blast radius graph-walk analysis
│       │   │   └── narration/    ← AI commentary via OpenAI/OpenRouter
│       │   └── prisma/           ← PrismaService + seed script
│       └── prisma/
│           └── schema.prisma     ← PostgreSQL schema (4 models)
│
├── bin/
│   └── cli.js                    ← Headless simulation CLI
│
├── docker-compose.yml            ← Local Postgres 16 + Redis 7
├── .env.example                  ← All env vars documented
├── railway.toml                  ← One-click Railway deployment
└── vercel.json                   ← SPA routing rewrite rules
```

---

## 🧠 The Simulation Engine — Technical Deep Dive

The heart of Archaos is a **discrete-event simulation engine** running inside a **Web Worker** — completely off the UI thread, so the canvas never stutters regardless of topology size.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          ARCHAOS SIMULATION ENGINE                          │
│                                                                             │
│  UI Thread                        Web Worker Thread                         │
│  ─────────────────                ──────────────────────────────────────    │
│  Editor.tsx                       simulation.worker.ts                      │
│  ┌────────────┐  postMessage()   ┌──────────────────────────────────────┐  │
│  │ Canvas     │ ──────────────►  │ PriorityQueue<SimEvent>              │  │
│  │ Controls   │                  │   min-heap keyed by .time (ms)       │  │
│  │            │  postMessage()   │                                      │  │
│  │ Telemetry  │ ◄────────────── │ tick() @ 250ms                       │  │
│  │ Panels     │   SimSnapshot   │   ├─ Drain events up to now          │  │
│  └────────────┘                  │   ├─ NodeStateMachine.step()        │  │
│                                  │   │   ├─ CPU / memory model         │  │
│  Zustand Store                   │   │   ├─ Replica saturation         │  │
│  simulationStore                 │   │   ├─ OOM / restart cycle        │  │
│  (snapshot atom)                 │   │   ├─ Queue depth / backpressure │  │
│                                  │   │   └─ Health: HEALTHY→DEGRADED   │  │
│                                  │   │             →FAILING→DEAD       │  │
│                                  │   └─ EdgeStateMachine.step()        │  │
│                                  │       ├─ Latency propagation        │  │
│                                  │       ├─ Circuit breaker FSM        │  │
│                                  │       │   CLOSED→OPEN→HALF_OPEN     │  │
│                                  │       └─ Packet loss / partition    │  │
│                                  └──────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Key Engine Behaviours

| Mechanism | How It Works |
|---|---|
| **Priority Queue** | Min-heap on event `.time`; O(log n) push/pop ensures correct event ordering |
| **Node State Machine** | `HEALTHY → DEGRADED → FAILING → DEAD → RECOVERING → HEALTHY` driven by error-rate thresholds |
| **CPU/Memory Model** | RPS → CPU% via `(rps / maxRps) × cpuLimit`; memory leaks grow by `+1.2%/tick` until OOM restart |
| **Circuit Breaker** | Per-edge: tracks error window; trips to OPEN after threshold; attempts HALF-OPEN after cooldown |
| **Cascading Failures** | Upstream nodes inherit elevated error rates from degraded downstream dependencies |
| **CDN Warmup** | CDN_EDGE nodes start cold (0% cache), warm over 10 ticks, then serve cache-hit savings |
| **Retry Storm** | `maxRetries × retryDelayMs` amplifies load on a struggling downstream; visible as RPS spike |
| **Custom Chaos Script** | YAML events are parsed into `{ atSec, type, targetId, value }` structs and pushed to priority queue |

---

## 🔐 Security Architecture

```
Request → NestJS Guards → JWT Validation → Controller → Service → Prisma
```

| Layer | Implementation |
|---|---|
| **Authentication** | Stateless JWT (RS256 via `@nestjs/jwt` + `passport-jwt`) |
| **Password Storage** | `bcrypt` with salt rounds (never stored in plain text) |
| **Route Protection** | `JwtAuthGuard` applied globally; public routes explicitly decorated with `@Public()` |
| **Input Validation** | `class-validator` + `class-transformer` on all DTOs; malformed payloads rejected at guard layer |
| **CORS** | Configured per `FRONTEND_URL` env var; wildcard disabled in production |
| **Secrets** | All keys via env vars; `.env.example` shipped, `.env` git-ignored |
| **Database** | Prisma parameterised queries — no raw SQL, no injection surface |
| **AI Key Isolation** | `OPENROUTER_API_KEY` / `OPENAI_API_KEY` never exposed to the frontend bundle |

---

## 🚀 Quick Start

### Prerequisites

| Tool | Version | Purpose |
|---|---|---|
| Node.js | ≥ 20 LTS | Runtime for both apps |
| npm | ≥ 10 | Workspace package manager |
| Docker + Compose | any recent | Local Postgres & Redis |
| Git | any | Clone the repo |

### 1. Clone

```bash
git clone https://github.com/narwal4421/Archaos.git
cd archaos
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and fill in:

```env
DATABASE_URL="postgresql://archaos_user:archaos_password@localhost:5433/archaos_db"
REDIS_URL="redis://localhost:6380"
JWT_SECRET="<generate with: openssl rand -hex 64>"
OPENROUTER_API_KEY="sk-or-..."    # for AI narration (optional)
PORT=5000
NODE_ENV=development
```

### 4. Start Infrastructure

```bash
npm run docker:up
# Starts Postgres 16 on :5433 and Redis 7 on :6380
```

### 5. Database Setup

```bash
cd apps/api
npx prisma migrate dev --name init
npx prisma db seed              # seeds built-in scenarios
cd ../..
```

### 6. Run the Full Stack

```bash
npm run dev
# Web  → http://localhost:5173
# API  → http://localhost:5000
```

That's it. Open `http://localhost:5173`, register an account, and start building your first topology.

---

## 🛠️ Tech Stack

### Frontend (`apps/web`)

| Technology | Version | Purpose |
|---|---|---|
| React | 19 | UI framework |
| Vite | 8 | Dev server + production bundler |
| TypeScript | 5.7 | Type safety across all components |
| Zustand | latest | Global state (auth, simulation snapshot) |
| React Router | v7 | Client-side routing |
| Lucide React | latest | Icon library |
| Web Workers API | native | Off-thread simulation engine |
| HTML5 Canvas | native | Topology rendering |
| CSS (Vanilla) | — | Dark-mode design system, animations |

### Backend (`apps/api`)

| Technology | Version | Purpose |
|---|---|---|
| NestJS | 11 | Modular REST API framework |
| Prisma | 6 | ORM + migrations + seeding |
| PostgreSQL | 16 | Primary data store |
| Redis (ioredis) | 7 | Caching + Socket.IO adapter |
| Passport + JWT | latest | Stateless authentication |
| bcrypt | 6 | Password hashing |
| OpenAI SDK | 6 | AI narration via OpenRouter/OpenAI |
| Socket.IO | latest | WebSocket transport (prepared) |
| class-validator | 0.15 | DTO validation |

### Infrastructure

| Tool | Purpose |
|---|---|
| Docker Compose | Local Postgres + Redis services |
| Railway | Backend API deployment (railway.toml) |
| Vercel | Frontend deployment with SPA rewrites |
| Prisma Migrate | Database schema versioning |

---

## 🗄️ Database Schema

```
┌──────────────┐         ┌───────────────┐
│    User      │────1:N──│   Topology    │
│──────────────│         │───────────────│
│ id (uuid)    │         │ id (uuid)     │
│ email        │         │ userId (fk)   │
│ passwordHash │         │ name          │
│ name         │         │ description   │
│ createdAt    │         │ isPublic      │
│ updatedAt    │         │ nodesJson     │  ← NodeConfig[]
└──────────────┘         │ edgesJson     │  ← EdgeConfig[]
       │                 │ thumbnail     │  ← base64 screenshot
       │                 │ createdAt     │
       │                 └───────────────┘
       │                        │
       │                        │ 1:N
       │                        ▼
       │                ┌───────────────┐
       └──────1:N───────│  SimSession   │
                        │───────────────│
                        │ id (uuid)     │
                        │ userId (fk)   │
                        │ topologyId    │  (nullable)
                        │ scenarioId    │  (nullable)
                        │ durationSecs  │
                        │ chaosEvents   │  ← JSON log of all injections
                        │ maxErrorRate  │
                        │ nodesKilled   │
                        │ createdAt     │
                        └───────────────┘

┌──────────────────┐
│    Scenario      │  (standalone — community/built-in blueprints)
│──────────────────│
│ id (uuid)        │
│ name             │
│ description      │
│ category         │  CASCADE | RETRY_STORM | THUNDERING_HERD | …
│ difficulty       │  BEGINNER | INTERMEDIATE | ADVANCED
│ nodesJson        │  ← pre-built NodeConfig[]
│ edgesJson        │  ← pre-built EdgeConfig[]
│ chaosScript      │  ← timed auto-inject events
│ walkthroughScript│  ← AI prediction checkpoints
│ isBuiltIn        │
│ playCount        │
│ upvotes          │
│ createdAt        │
└──────────────────┘
```

---

## 📜 Available Scripts

### Root (Monorepo)

```bash
npm run dev           # Start web + API concurrently (with hot reload)
npm run dev:web       # Start only Vite dev server  (port 5173)
npm run dev:api       # Start only NestJS dev server (port 5000, --watch)
npm run build         # Production build: API then Web
npm run build:web     # Vite production build → apps/web/dist
npm run build:api     # NestJS tsc build → apps/api/dist
npm run docker:up     # Start Postgres + Redis containers (detached)
npm run docker:down   # Stop and remove containers
```

### API (`apps/api`)

```bash
npm run start:prod    # migrate + seed + run dist/main (production)
npm run lint          # ESLint with auto-fix
npm run format        # Prettier format
npm run test          # Jest unit tests
npm run test:cov      # Tests with coverage report
npm run test:e2e      # End-to-end tests (supertest)
```

### Database

```bash
npx prisma migrate dev --name <migration-name>   # Create + apply migration
npx prisma migrate deploy                         # Apply pending migrations (prod)
npx prisma db seed                                # Seed built-in scenarios
npx prisma studio                                 # Visual DB browser (localhost:5555)
npx prisma generate                               # Re-generate Prisma client
```

### CLI — Headless Simulation

```bash
node bin/cli.js config.json --url http://localhost:5000
```

**`config.json` format:**

```json
{
  "nodes": [...],
  "edges": [...],
  "chaosScript": [
    { "atSec": 5, "type": "KILL_NODE", "targetId": "db-primary" },
    { "atSec": 15, "type": "ADD_LATENCY", "targetId": "api-edge-1", "value": 500 }
  ],
  "durationSecs": 30
}
```

**Exit codes:** `0` = SLA compliant (avg error rate < 5%), `1` = SLA breached.  
Designed to drop into any CI/CD pipeline as a quality gate.

---

## 🌐 Node Types Supported

| Node Type | Icon | Description |
|---|---|---|
| `SERVICE` | ⬡ | Generic microservice with replicas, CPU, memory limits |
| `API_GATEWAY` | 🔀 | Ingress gateway with routing |
| `LOAD_BALANCER` | ⚖️ | Round-robin, least-connections, or IP-hash |
| `DATABASE` | 🗄️ | PostgreSQL, MongoDB, Redis, Cassandra with replication modes |
| `MESSAGE_QUEUE` | 📨 | Kafka, RabbitMQ, SQS with queue depth and backpressure |
| `EXTERNAL_SERVICE` | 🌐 | Third-party dependency with configurable reliability% |
| `KAFKA` | ⚡ | Apache Kafka broker node |
| `RABBITMQ` | 🐇 | RabbitMQ broker node |
| `ELASTICSEARCH` | 🔍 | Search database cluster node |
| `REDIS` | ⚡ | Redis cache / pub-sub node |
| `CDN` | 🌍 | Content delivery network with warmup simulation |
| `CDN_EDGE` | 📡 | Geographic cache edge pop |

---

## 💥 Chaos Types Available

| Chaos Action | What It Does |
|---|---|
| `KILL_NODE` | Instantly sets node health to `DEAD`; downstream deps cascade |
| `CPU_SPIKE` | Pins a node's CPU to N% — triggers saturation and request drops |
| `MEMORY_LEAK` | Activates heap growth at +1.2%/tick until OOM restart cycle |
| `ADD_LATENCY` | Adds N ms to an edge; p99 propagates upstream |
| `PACKET_LOSS` | N% of requests on an edge silently dropped |
| `NETWORK_PARTITION` | Full edge isolation — splits topology like a real CAP event |
| `TOGGLE_CIRCUIT_BREAKER` | Opens/closes circuit breaker on a specific edge |
| `TRAFFIC_SPIKE` | Multiplies incoming RPS by N× to test saturation limits |

---

## 🌐 API Reference

The REST API is served at `/api` (default port `5000`).

| Method | Endpoint | Auth | Description |
|---|---|:---:|---|
| `GET` | `/` | ❌ | Health check — returns `{ status: 'ok' }` |
| `POST` | `/auth/register` | ❌ | Create account |
| `POST` | `/auth/login` | ❌ | Get JWT token |
| `GET` | `/topologies` | ✅ | List user's saved topologies |
| `POST` | `/topologies` | ✅ | Save a new topology |
| `PATCH` | `/topologies/:id` | ✅ | Update topology |
| `DELETE` | `/topologies/:id` | ✅ | Delete topology |
| `GET` | `/scenarios` | ✅ | List all scenarios (built-in + community) |
| `POST` | `/scenarios` | ✅ | Publish a community scenario |
| `POST` | `/scenarios/:id/upvote` | ✅ | Upvote a community scenario |
| `POST` | `/sessions` | ✅ | Record a completed simulation session |
| `POST` | `/blast/analyze` | ✅ | Compute blast radius for a topology |
| `POST` | `/run-headless` | ❌ | Run a simulation headlessly (CI mode) |

**Authentication:** Pass `Authorization: Bearer <token>` header.

---

## 🛰️ Infrastructure Import

Archaos can parse three infrastructure-as-code formats and auto-generate a topology:

### Docker Compose
```yaml
services:
  api:
    image: node:20
    depends_on: [postgres, redis]
  postgres:
    image: postgres:16
  redis:
    image: redis:7
```
→ Auto-creates `SERVICE` node for `api`, `DATABASE` for `postgres`, `DATABASE` node for `redis`, with edges from `api` → `postgres` and `api` → `redis`.

### Kubernetes YAML
Parses `Deployment`, `Service`, and `Ingress` objects:
- `Deployment` → `SERVICE` node (replicas extracted)
- `Service` (LoadBalancer) → `LOAD_BALANCER` node
- `Ingress` → `API_GATEWAY` node

### Terraform HCL
Regex-based extraction of `aws_instance`, `aws_db_instance`, `aws_elb`, `aws_cloudfront_distribution` → corresponding node types, linked by variable references.

---

## ☁️ Deployment Guide

### Frontend → Vercel

```bash
vercel --prod
# vercel.json already configures SPA rewrites for React Router
```

Or connect your GitHub repo to Vercel — it auto-detects Vite.

**Build settings:**
- Build command: `npm run build:web`
- Output directory: `apps/web/dist`
- Root: `apps/web`

### Backend → Railway

```bash
# Install Railway CLI
npm install -g @railway/cli
railway login
railway up
```

`railway.toml` is already configured. Add these environment variables in the Railway dashboard:
- `DATABASE_URL` (Railway Postgres plugin auto-injects)
- `REDIS_URL` (Railway Redis plugin auto-injects)
- `JWT_SECRET`
- `OPENROUTER_API_KEY`

### Self-Hosted (Docker)

```dockerfile
# The API ships with a production Dockerfile
docker build -t archaos-api ./apps/api
docker run -p 5000:5000 \
  -e DATABASE_URL=... \
  -e REDIS_URL=... \
  -e JWT_SECRET=... \
  archaos-api
```

---

## ✅ Full Feature Checklist

### Core Canvas & Editor
- [x] Drag-and-drop node palette
- [x] Edge connection with label + type selector
- [x] In-canvas live telemetry (RPS, error%, p99, CPU, memory, queue)
- [x] Node health colour coding (green → amber → red → dead)
- [x] Circuit breaker state visualisation per edge
- [x] Canvas pan & zoom
- [x] Topology save / load / delete
- [x] Thumbnail screenshot on save (base64)
- [x] Version checkpoint system (v1/v2/v3) + visual diff viewer

### Simulation Engine
- [x] Off-thread Web Worker simulation
- [x] Priority queue discrete-event architecture
- [x] Node state machine (HEALTHY → DEAD → RECOVERING)
- [x] CPU / memory / replica saturation models
- [x] OOM restart cycles
- [x] Queue backpressure modelling
- [x] Edge latency propagation
- [x] Circuit breaker FSM per edge
- [x] Retry storm amplification
- [x] Cascading failure propagation
- [x] CDN cache warmup behaviour
- [x] Custom YAML chaos script execution

### Chaos Injection
- [x] Kill node
- [x] CPU spike
- [x] Memory leak
- [x] Add latency to edge
- [x] Packet loss on edge
- [x] Network partition (full edge isolation)
- [x] Traffic spike multiplier
- [x] Toggle circuit breaker

### Infrastructure Import
- [x] Docker Compose parser
- [x] Kubernetes YAML parser
- [x] Terraform HCL parser
- [x] Auto-layout (topological tier positioning)
- [x] Glassmorphic import dialog with tabbed interface

### Scenarios & Marketplace
- [x] Built-in: The Cascade, Retry Storm, Thundering Herd, Split Brain, Graceful Degradation, Queue Flood, Memory Leak, Traffic Spike
- [x] Community scenario publishing
- [x] Upvoting system
- [x] Category + difficulty filtering
- [x] Search
- [x] Share scenario modal

### Cloud Blueprints
- [x] AWS 3-Tier Web App template
- [x] Netflix Microservices stack template
- [x] Uber Dispatch stack template
- [x] GCP / Azure AKS templates

### Node Types
- [x] SERVICE, DATABASE, MESSAGE_QUEUE, LOAD_BALANCER, API_GATEWAY
- [x] EXTERNAL_SERVICE, CDN, CDN_EDGE, KAFKA, RABBITMQ, ELASTICSEARCH, REDIS
- [x] Logical layer tagging (FRONTEND / API / DATA)

### Authentication & Users
- [x] Register / Login with bcrypt + JWT
- [x] Protected routes with JwtAuthGuard
- [x] Session recording (duration, events, peak error rate)

### AI Features
- [x] Real-time GPT narration explaining what's happening
- [x] Prediction checkpoints in scenario walkthroughs
- [x] OpenRouter + OpenAI backend support

### Blast Radius
- [x] Upstream graph walk from selected node
- [x] Visual blast zone highlighting on canvas

### Headless / CI
- [x] `POST /run-headless` REST endpoint
- [x] `bin/cli.js` CLI tool
- [x] SLA compliance exit codes (0 / 1)

### Learn Center
- [x] CAP Theorem interactive lesson
- [x] Cascading failures module
- [x] Circuit breakers module
- [x] Retry storms and backoff module
- [x] Thundering herd / cache stampede module
- [x] Memory leaks module

---

## 🤝 Contributing

Contributions are what make open source thrive. Any contribution you make is **genuinely appreciated**.

### Workflow

```bash
# 1. Fork the repository on GitHub

# 2. Clone your fork
git clone https://github.com/<your-username>/Archaos.git
cd archaos

# 3. Create a feature branch (never commit to main)
git checkout -b feat/your-amazing-feature

# 4. Make your changes and commit following Conventional Commits
git commit -m "feat: add real-time collaboration via WebSocket"
git commit -m "fix: circuit breaker not resetting after recovery"
git commit -m "docs: add deployment guide for Fly.io"

# 5. Push and open a Pull Request
git push origin feat/your-amazing-feature
```

### Commit Convention

| Prefix | When to use |
|---|---|
| `feat:` | New feature |
| `fix:` | Bug fix |
| `docs:` | Documentation only |
| `refactor:` | Code change, no feature/fix |
| `test:` | Adding or updating tests |
| `chore:` | Tooling, config, CI |

### What We're Looking For

- New chaos injection types (DNS failures, disk I/O exhaustion)
- Additional infrastructure parsers (AWS CDK, Pulumi)
- Real-time collaboration (WebSocket multi-cursor topology editing)
- Simulation replay & export (JSON recording → playback)
- Dark/light theme toggle
- Unit tests for simulation engine edge cases

Please open an issue before starting large features so we can discuss the approach.

---

## 📄 License

Distributed under the **MIT License**.  
See [`LICENSE`](./LICENSE) for full text.

```
MIT License — Copyright (c) 2026 Archaos Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software...
```

---

<div align="center">

**Built with ❤️ and controlled chaos.**

*If Archaos helped you understand distributed systems, please consider giving it a ⭐ — it means everything.*

[![GitHub stars](https://img.shields.io/github/stars/narwal4421/Archaos?style=social)](https://github.com/narwal4421/Archaos/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/narwal4421/Archaos?style=social)](https://github.com/narwal4421/Archaos/network/members)

</div>
