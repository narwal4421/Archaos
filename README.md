<div align="center">
  <br />
  <h1>🌌 ARCHAOS</h1>
  <p>
    <b>The Cinematic Distributed Systems War Room & Chaos Simulator</b>
  </p>
  <p>
    Stop reading about cascading failures. <b>Watch them happen.</b>
  </p>
  <br />

  <p align="center">
    <a href="https://nodejs.org/"><img src="https://img.shields.io/badge/Node.js-20.0+-blue?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" /></a>
    <a href="https://nestjs.com/"><img src="https://img.shields.io/badge/NestJS-11.0-E0234E?style=for-the-badge&logo=nestjs&logoColor=white" alt="NestJS" /></a>
    <a href="https://react.dev/"><img src="https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" /></a>
    <a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/TailwindCSS-4.0-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="TailwindCSS" /></a>
    <a href="https://www.prisma.io/"><img src="https://img.shields.io/badge/Prisma-6.0-2D3748?style=for-the-badge&logo=prisma&logoColor=white" alt="Prisma" /></a>
    <a href="https://socket.io/"><img src="https://img.shields.io/badge/Socket.io-4.0-010101?style=for-the-badge&logo=socket.io&logoColor=white" alt="Socket.io" /></a>
  </p>
  
  <p align="center">
    <a href="#-what-is-archaos"><strong>Explore the Docs</strong></a> ·
    <a href="#-quick-start-guide"><strong>Quick Start</strong></a> ·
    <a href="#-the-simulation-engine-deep-dive"><strong>Deep Dive</strong></a>
  </p>
</div>

<hr />

## 🚨 What is Archaos?

**Archaos** is a high-fidelity, interactive distributed systems playground. Built for engineers, architects, and students, it replaces static diagrams and dry architectural documents with a **live, visual simulation engine**.

Design your architecture, set queue depths, configure circuit breakers, and then **inject chaos**. Watch as a single database latency spike triggers thread-pool exhaustion, initiates a retry storm, and ultimately takes down your API gateway—all visualized in real-time with a premium, dark-mode cinematic interface.

To top it off, an **AI Incident Narrator** (powered by OpenAI/OpenRouter) watches the carnage alongside you, streaming causal explanations and predicting what will break next.

### 🌟 Why This Repo Deserves a Star
* **100% Client-Side Simulation**: No heavy Kubernetes clusters required. Millions of virtual requests are routed in real-time inside a dedicated HTML5 Web Worker.
* **Multiplayer Incident Response**: Invite your team into a live `socket.io` room. One person injects a network partition, the other scrambles to scale up replicas.
* **Math-Backed Physics**: This isn't an animation. It's a Discrete Event Simulator (DES) modeling actual queueing theory, backpressure, and sliding-window error rates.

---

## ⚡ Core Capabilities

<table>
  <tr>
    <td width="50%">
      <h3>🏗️ Interactive Topology Builder</h3>
      Drag and drop API Gateways, Microservices, Caches, and Databases. Connect them with HTTP or TCP edges. Configure max retries, connection pools, and circuit breaker thresholds down to the millisecond.
    </td>
    <td width="50%">
      <h3>🌪️ Chaos Engineering Engine</h3>
      Inject CPU spikes, database latency, cache expirations, and network partitions. Watch the blast radius propagate visually as nodes degrade from healthy to critical.
    </td>
  </tr>
  <tr>
    <td width="50%">
      <h3>🤖 Live AI Narration</h3>
      An LLM agent monitors your simulation state via WebSockets. When a node fails, it streams a causal analysis, identifies the underlying distributed systems concept (e.g., <i>"Thundering Herd"</i>), and predicts the next failure.
    </td>
    <td width="50%">
      <h3>🎓 Interactive Scenarios</h3>
      Learn by doing. Play through built-in challenges like <i>The Cascade</i>, <i>The Retry Storm</i>, and <i>Split Brain</i>. Answer interactive questions as the disaster unfolds.
    </td>
  </tr>
</table>

---

## 🧠 The Simulation Engine (Deep Dive)

The heart of Archaos is a **Discrete Event Simulator (DES)** running completely isolated in a Web Worker (`simulation.worker.ts`). This ensures the React UI stays at a buttery-smooth 60fps even when simulating 10,000+ RPS.

### The Physics of Failure
Archaos doesn't just "turn nodes red." It calculates failure based on real distributed systems mathematics:

#### 1. Queue Backpressure
Each service maintains a finite request queue. When incoming requests exceed the processing capacity (determined by CPU limits and healthy replicas), the queue fills up. 
Once `queueDepth >= maxQueueDepth`, the service sheds load (HTTP 503). Upstream services waiting on this node will exhaust their own connection pools, propagating the latency upward.

#### 2. Sliding-Window Circuit Breakers
Edges can be configured with circuit breakers. The engine maintains a rolling timestamp ring-buffer.

$$ \text{Error Rate (10s)} = \left( \frac{\sum \text{Failed Requests}}{\sum \text{Total Requests}} \right) \times 100 $$

If the error rate crosses the `errorThresholdPercent`, the circuit **OPENS**, immediately failing fast to protect the downstream service. After `halfOpenAfterSecs`, it allows probe requests to test recovery.

#### 3. Memory Leaks & OOM Kills
Memory utilization is modeled to drift naturally based on CPU churn. However, if a "Memory Leak" chaos event is injected, memory accumulates linearly until `memoryPercent >= 100%`, at which point the replica suffers an Out-Of-Memory (OOM) kill, halving the node's throughput capacity.

### Engine Architecture
```mermaid
graph TD
    subgraph Browser Main Thread
        UI[React 19 / XYFlow Canvas]
        Metrics[Zustand Store / Sparklines]
    end

    subgraph HTML5 Web Worker (Isolated)
        Loop[Discrete Event Loop]
        PQ[Priority Queue - Heap Sorted]
        Nodes[(Service Node States)]
        Edges[(Edge Runtime States)]
        
        Loop -->|Pop Next Event| PQ
        PQ -->|Route Request| Nodes
        Nodes -->|Forward| Edges
        Edges -->|Backpressure| Nodes
    end

    UI -- "Inject Chaos / Edit Config" --> Loop
    Loop -- "60Hz State Sync (60fps)" --> Metrics
```

---

## 🏗️ System Architecture

Archaos is a modern **TypeScript Monorepo**, utilizing Vite for the frontend and NestJS for the robust backend.

### Tech Stack Matrix

| Layer | Technologies Used | Purpose & Implementation |
| :--- | :--- | :--- |
| **Frontend UI** | React 19, Tailwind CSS 4.0, Framer Motion | High-performance, cinematic user interface with fluid micro-interactions. |
| **Canvas / Graph**| `@xyflow/react`, `d3-shape` | Drag-and-drop topology rendering and bezier curve math for animated request paths. |
| **State Mgt** | `zustand` | Global state management across the canvas, simulation, and auth contexts. |
| **Backend API** | NestJS 11, TypeScript | Modular, scalable REST API and WebSocket gateway architecture. |
| **Database** | PostgreSQL, Prisma 6 | Relational storage for topologies, user accounts, and historical scenarios. |
| **Real-Time** | `socket.io`, `ioredis` | Syncing multiplayer simulation rooms and caching WebSocket client states. |
| **AI Integration**| OpenAI SDK, OpenRouter | Streaming HTTP integration for the live AI Incident Narrator (`gpt-oss-120b`). |

---

## 🚀 Quick Start Guide

Get Archaos running locally in under 3 minutes.

### 1. Prerequisites
- **Node.js**: `v20+`
- **Docker**: For spinning up local Postgres and Redis instances.

### 2. Clone & Install
```bash
git clone https://github.com/narwal4421/Archaos.git
cd Archaos
npm install
```

### 3. Environment Configuration
Set up your backend variables:
```bash
cp .env.example .env
```
Ensure your `.env` contains:
```env
DATABASE_URL="postgresql://archaos_user:archaos_password@localhost:5433/archaos_db?schema=public"
REDIS_URL="redis://localhost:6380"
JWT_SECRET="your-super-secret-jwt-key"
OPENAI_API_KEY="sk-..." # Your OpenAI or OpenRouter Key (Optional, fallback exists)
```

Set up your frontend variables:
```bash
cp apps/web/.env.example apps/web/.env
```
*(Optionally provide Supabase keys if deploying to the cloud).*

### 4. Spin up Infrastructure
Launch the database and cache using Docker Compose:
```bash
npm run docker:up
```

### 5. Migrate & Seed the Database
Initialize the Prisma client, push the schema, and seed the interactive scenarios (like *The Cascade*):
```bash
npm run build:api
npx prisma db seed
```

### 6. Launch the War Room
Start both the Vite frontend and NestJS backend concurrently:
```bash
npm run dev
```
🔥 **Ready to break things?** Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🌍 Multiplayer & Collaboration

Archaos isn't a single-player game. It features **Socket.io** powered collaborative incident rooms.

* **Live Topology Syncing**: When you drag a node or change a circuit breaker's timeout, the JSON configuration is synchronized to all connected peers in milliseconds using Last-Write-Wins (LWW) conflict resolution.
* **Shared Chaos Injection**: Coordinate failure testing with your team. One operator simulates a CPU spike, while another monitors the live multi-signal sparklines (RPS, Errors, Latency).
* **Broadcast Narration**: The AI's streaming causal analysis is multiplexed to all users in the room simultaneously.

---

## 📦 Monorepo Scripts

Manage the entire workspace from the root directory:

| Command | Description |
| :--- | :--- |
| `npm run dev` | 🔥 Starts both frontend (Vite) and backend (NestJS) in watch mode. |
| `npm run build` | Compiles both applications for production deployment. |
| `npm run docker:up` | Boots local PostgreSQL and Redis containers. |
| `npm run docker:down`| Tears down local infrastructure containers. |
| `npm run lint` | Runs ESLint across all workspace packages. |

*To run commands for a specific app, append `-w apps/web` or `-w apps/api`.*

---

## ☁️ Deployment Guide

Archaos is cloud-ready and designed to be deployed on modern serverless/PaaS infrastructure.

### Backend (Railway / Render)
1. Provision a PostgreSQL (v16) and Redis (v7) instance.
2. Link your GitHub repo and point the root directory to `apps/api`.
3. Set the build command: `npm run build:api`.
4. Set the start command: `npm run start:prod`.
5. Supply the `.env` variables from your local setup.

### Frontend (Vercel / Netlify)
1. Import the repository and set the root directory to `apps/web`.
2. The framework preset should auto-detect Vite.
3. Build command: `tsc -b && vite build` | Output directory: `dist`.
4. Supply your `VITE_SUPABASE_URL` and anon key.

---

## 🤝 Contributing

We welcome contributions to make Archaos the ultimate chaos engineering educational tool!

1. **Fork** the repo on GitHub.
2. **Clone** your fork locally.
3. **Branch** out: `git checkout -b feat/epic-new-chaos-mode`
4. **Commit** using conventional commits: `git commit -m "feat: add BGP route flapping simulation"`
5. **Push** and open a Pull Request against the `main` branch.

If you find a bug or have a feature request, please open an Issue.

---

## 📜 License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.

<div align="center">
  <br />
  <p>
    <b>Built with ❤️ for Distributed Systems Engineers</b>
  </p>
  <p>
    <i>If Archaos helped you understand systemic failure, please consider giving it a ⭐!</i>
  </p>
</div>
