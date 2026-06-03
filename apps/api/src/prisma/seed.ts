import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Clear existing scenarios
  await prisma.scenario.deleteMany();

  // Define Scenario 1 and 5 Shared Topology
  const cascadeNodes = [
    {
      id: 'api-gateway',
      type: 'API_GATEWAY',
      label: 'API Gateway',
      x: 80,
      y: 250,
    },
    {
      id: 'gateway-service',
      type: 'SERVICE',
      label: 'Gateway Service',
      x: 220,
      y: 250,
      replicas: 2,
      processingTimeMs: 30,
    },
    {
      id: 'order-service',
      type: 'SERVICE',
      label: 'Order Service',
      x: 380,
      y: 160,
      replicas: 2,
      processingTimeMs: 40,
    },
    {
      id: 'user-service',
      type: 'SERVICE',
      label: 'User Service',
      x: 380,
      y: 340,
      replicas: 2,
      processingTimeMs: 40,
    },
    {
      id: 'inventory-service',
      type: 'SERVICE',
      label: 'Inventory Service',
      x: 540,
      y: 100,
      replicas: 1,
      processingTimeMs: 30,
    },
    {
      id: 'payment-service',
      type: 'SERVICE',
      label: 'Payment Service',
      x: 540,
      y: 220,
      replicas: 1,
      processingTimeMs: 60,
    },
    {
      id: 'billing-service',
      type: 'SERVICE',
      label: 'Billing Service',
      x: 700,
      y: 220,
      replicas: 1,
      processingTimeMs: 40,
    },
    {
      id: 'postgres-db',
      type: 'DATABASE',
      label: 'PostgreSQL DB',
      x: 860,
      y: 220,
      dbType: 'POSTGRESQL',
      connectionPoolSize: 20,
    },
  ];

  const cascadeEdgesNoCB = [
    {
      id: 'edge-gw-gateway',
      type: 'HTTP',
      sourceId: 'api-gateway',
      targetId: 'gateway-service',
    },
    {
      id: 'edge-gateway-order',
      type: 'HTTP',
      sourceId: 'gateway-service',
      targetId: 'order-service',
    },
    {
      id: 'edge-gateway-user',
      type: 'HTTP',
      sourceId: 'gateway-service',
      targetId: 'user-service',
    },
    {
      id: 'edge-order-inventory',
      type: 'HTTP',
      sourceId: 'order-service',
      targetId: 'inventory-service',
    },
    {
      id: 'edge-order-payment',
      type: 'HTTP',
      sourceId: 'order-service',
      targetId: 'payment-service',
    },
    {
      id: 'edge-payment-billing',
      type: 'HTTP',
      sourceId: 'payment-service',
      targetId: 'billing-service',
    },
    {
      id: 'edge-billing-db',
      type: 'DATABASE_CONN',
      sourceId: 'billing-service',
      targetId: 'postgres-db',
    },
  ];

  const cascadeEdgesWithCB = [
    {
      id: 'edge-gw-gateway',
      type: 'HTTP',
      sourceId: 'api-gateway',
      targetId: 'gateway-service',
    },
    {
      id: 'edge-gateway-order',
      type: 'HTTP',
      sourceId: 'gateway-service',
      targetId: 'order-service',
      timeoutMs: 1000,
      circuitBreakerEnabled: true,
      cbErrorThresholdPercent: 30,
      cbHalfOpenAfterSecs: 15,
    },
    {
      id: 'edge-gateway-user',
      type: 'HTTP',
      sourceId: 'gateway-service',
      targetId: 'user-service',
    },
    {
      id: 'edge-order-inventory',
      type: 'HTTP',
      sourceId: 'order-service',
      targetId: 'inventory-service',
    },
    {
      id: 'edge-order-payment',
      type: 'HTTP',
      sourceId: 'order-service',
      targetId: 'payment-service',
      timeoutMs: 1000,
      circuitBreakerEnabled: true,
      cbErrorThresholdPercent: 30,
      cbHalfOpenAfterSecs: 15,
    },
    {
      id: 'edge-payment-billing',
      type: 'HTTP',
      sourceId: 'payment-service',
      targetId: 'billing-service',
      timeoutMs: 1000,
      circuitBreakerEnabled: true,
      cbErrorThresholdPercent: 30,
      cbHalfOpenAfterSecs: 15,
    },
    {
      id: 'edge-billing-db',
      type: 'DATABASE_CONN',
      sourceId: 'billing-service',
      targetId: 'postgres-db',
    },
  ];

  const scenarios = [
    {
      name: 'The Cascade',
      category: 'CASCADE',
      difficulty: 'BEGINNER',
      description:
        'A database slowdown cascades upstream through 6 services in 90 seconds, freezing the entire application.',
      isBuiltIn: true,
      nodesJson: cascadeNodes,
      edgesJson: cascadeEdgesNoCB,
      chaosScript: [
        {
          atSec: 15,
          action: {
            type: 'ADD_LATENCY',
            targetId: 'edge-billing-db',
            value: 4000,
          },
        },
      ],
      walkthroughScript: [
        {
          atSec: 20,
          pause: true,
          question:
            'We just injected 4000ms of database latency. With no circuit breakers, what happens first?',
          options: [
            'PostgreSQL DB restarts automatically',
            'Billing Service queries back up, causing thread exhaustion as it blocks waiting for Postgres',
            'The API Gateway drops all traffic immediately',
            'The entire layout scales up in replica count',
          ],
          correct: 1,
        },
        {
          atSec: 50,
          pause: true,
          question:
            'The latency is cascading back through Payment, Order, and Gateway services. Why does this freeze the entire frontend?',
          options: [
            'A frontend script crashed',
            'A network partition occurred',
            'Each hop blocks its own thread pool waiting for downstream responses, propagating the delay all the way back to the gateway',
            'The load balancer algorithm changed to IP Hash',
          ],
          correct: 2,
        },
      ],
    },
    {
      name: 'The Retry Storm',
      category: 'RETRY_STORM',
      difficulty: 'INTERMEDIATE',
      description:
        'Aggressive retries without backoff or jitter amplify load 4x on a struggling service, turning a minor slowdown into a complete meltdown.',
      isBuiltIn: true,
      nodesJson: [
        {
          id: 'api-gateway',
          type: 'API_GATEWAY',
          label: 'API Gateway',
          x: 100,
          y: 200,
        },
        {
          id: 'order-service',
          type: 'SERVICE',
          label: 'Order Service',
          x: 320,
          y: 200,
          replicas: 2,
          processingTimeMs: 40,
        },
        {
          id: 'payment-service',
          type: 'SERVICE',
          label: 'Payment Service',
          x: 580,
          y: 200,
          replicas: 1,
          processingTimeMs: 100,
        },
      ],
      edgesJson: [
        {
          id: 'edge-gw-order',
          type: 'HTTP',
          sourceId: 'api-gateway',
          targetId: 'order-service',
        },
        {
          id: 'edge-order-payment',
          type: 'HTTP',
          sourceId: 'order-service',
          targetId: 'payment-service',
          timeoutMs: 200,
          maxRetries: 3,
          retryBackoff: 'FIXED',
          retryDelayMs: 50,
        },
      ],
      chaosScript: [
        {
          atSec: 15,
          action: { type: 'CPU_SPIKE', targetId: 'payment-service' },
        },
      ],
      walkthroughScript: [
        {
          atSec: 25,
          pause: true,
          question:
            "Payment Service response times now exceed Order Service's 200ms timeout. Since maxRetries is 3, what is the effect of fixed retries?",
          options: [
            'It provides a safety net by healing errors',
            'It amplifies the traffic load on Payment Service by 4x, preventing it from ever recovering',
            'It triggers an automatic scale-out of Payment Service',
            'It shuts down the API Gateway to prevent overload',
          ],
          correct: 1,
        },
      ],
    },
    {
      name: 'The Thundering Herd',
      category: 'THUNDERING_HERD',
      difficulty: 'INTERMEDIATE',
      description:
        'A critical cache item expires, sending a stampede of concurrent requests directly to the PostgreSQL database, exhausting connection pools.',
      isBuiltIn: true,
      nodesJson: [
        {
          id: 'api-gateway',
          type: 'API_GATEWAY',
          label: 'API Gateway',
          x: 100,
          y: 200,
        },
        {
          id: 'catalog-service',
          type: 'SERVICE',
          label: 'Catalog Service',
          x: 320,
          y: 200,
          replicas: 3,
          processingTimeMs: 30,
        },
        {
          id: 'redis-cache',
          type: 'DATABASE',
          label: 'Redis Cache',
          x: 550,
          y: 100,
          dbType: 'REDIS',
        },
        {
          id: 'postgres-db',
          type: 'DATABASE',
          label: 'PostgreSQL DB',
          x: 550,
          y: 300,
          dbType: 'POSTGRESQL',
          connectionPoolSize: 5,
        },
      ],
      edgesJson: [
        {
          id: 'edge-gw-catalog',
          type: 'HTTP',
          sourceId: 'api-gateway',
          targetId: 'catalog-service',
        },
        {
          id: 'edge-catalog-cache',
          type: 'DATABASE_CONN',
          sourceId: 'catalog-service',
          targetId: 'redis-cache',
        },
        {
          id: 'edge-catalog-db',
          type: 'DATABASE_CONN',
          sourceId: 'catalog-service',
          targetId: 'postgres-db',
        },
      ],
      chaosScript: [
        {
          atSec: 15,
          action: { type: 'CACHE_EXPIRE', targetId: 'postgres-db' },
        },
      ],
      walkthroughScript: [
        {
          atSec: 20,
          pause: true,
          question:
            'The Redis cache key has expired under heavy traffic. Without cache-aside locking, what occurs?',
          options: [
            'Catalog Service routes queries to the load balancer',
            'Catalog Service falls back to an in-memory queue',
            'All concurrent queries hit PostgreSQL simultaneously, exhausting the database connection pool',
            'Postgres automatically increases its connections limit',
          ],
          correct: 2,
        },
      ],
    },
    {
      name: 'Split Brain',
      category: 'SPLIT_BRAIN',
      difficulty: 'ADVANCED',
      description:
        'A network partition separates primary and replica databases. Both think the other is dead and accept writes independently, causing massive data divergence.',
      isBuiltIn: true,
      nodesJson: [
        {
          id: 'gw-east',
          type: 'API_GATEWAY',
          label: 'GW East',
          x: 100,
          y: 150,
        },
        {
          id: 'gw-west',
          type: 'API_GATEWAY',
          label: 'GW West',
          x: 100,
          y: 350,
        },
        {
          id: 'db-east',
          type: 'DATABASE',
          label: 'DB East (Leader)',
          x: 400,
          y: 150,
          dbType: 'POSTGRESQL',
          replicationMode: 'PRIMARY_REPLICA',
        },
        {
          id: 'db-west',
          type: 'DATABASE',
          label: 'DB West (Follower)',
          x: 400,
          y: 350,
          dbType: 'POSTGRESQL',
          replicationMode: 'PRIMARY_REPLICA',
        },
      ],
      edgesJson: [
        {
          id: 'edge-east-gw-db',
          type: 'DATABASE_CONN',
          sourceId: 'gw-east',
          targetId: 'db-east',
        },
        {
          id: 'edge-west-gw-db',
          type: 'DATABASE_CONN',
          sourceId: 'gw-west',
          targetId: 'db-west',
        },
        {
          id: 'db-east-db-west-sync',
          type: 'DATABASE_CONN',
          sourceId: 'db-east',
          targetId: 'db-west',
        },
      ],
      chaosScript: [
        {
          atSec: 15,
          action: {
            type: 'NETWORK_PARTITION',
            targetId: 'db-east-db-west-sync',
          },
        },
      ],
      walkthroughScript: [
        {
          atSec: 25,
          pause: true,
          question:
            'The database replication link is partitioned. If both databases promote themselves to write-leaders, what is this divergence state called?',
          options: [
            'Brain Drain',
            'Consensus Storm',
            'Split Brain',
            'Partition Exhaustion',
          ],
          correct: 2,
        },
      ],
    },
    {
      name: 'Graceful Degradation',
      category: 'GRACEFUL_DEGRADATION',
      difficulty: 'BEGINNER',
      description:
        'The EXACT same topology and database chaos as The Cascade, but with circuit breakers enabled. The slowdown is isolated, and the system survives.',
      isBuiltIn: true,
      nodesJson: cascadeNodes,
      edgesJson: cascadeEdgesWithCB,
      chaosScript: [
        {
          atSec: 15,
          action: {
            type: 'ADD_LATENCY',
            targetId: 'edge-billing-db',
            value: 4000,
          },
        },
      ],
      walkthroughScript: [
        {
          atSec: 25,
          pause: true,
          question:
            'This is the EXACT same failure as Scenario 1. However, circuit breakers are enabled. What happens when Billing Service gets slow?',
          options: [
            'The database automatically recovers',
            'The circuit breaker on edge-payment-billing trips open, failing fast and protecting the upstream Order and Gateway services',
            'The API Gateway restarts',
            'Nothing, the entire system still freezes',
          ],
          correct: 1,
        },
      ],
    },
    {
      name: 'The Queue Flood',
      category: 'QUEUE_FLOOD',
      difficulty: 'INTERMEDIATE',
      description:
        'The consumer service dies, causing a Kafka message queue to build up. Producers experience backpressure and block. Consumer recovers, and the queue drains.',
      isBuiltIn: true,
      nodesJson: [
        {
          id: 'api-gateway',
          type: 'API_GATEWAY',
          label: 'API Gateway',
          x: 100,
          y: 200,
        },
        {
          id: 'producer-service',
          type: 'SERVICE',
          label: 'Producer Service',
          x: 320,
          y: 200,
          replicas: 2,
          processingTimeMs: 40,
        },
        {
          id: 'kafka-queue',
          type: 'MESSAGE_QUEUE',
          label: 'Kafka Queue',
          x: 550,
          y: 200,
          queueType: 'KAFKA',
          maxQueueDepth: 300,
        },
        {
          id: 'consumer-service',
          type: 'SERVICE',
          label: 'Consumer Service',
          x: 780,
          y: 200,
          replicas: 1,
          processingTimeMs: 50,
        },
      ],
      edgesJson: [
        {
          id: 'edge-gw-prod',
          type: 'HTTP',
          sourceId: 'api-gateway',
          targetId: 'producer-service',
        },
        {
          id: 'edge-prod-queue',
          type: 'HTTP',
          sourceId: 'producer-service',
          targetId: 'kafka-queue',
        },
        {
          id: 'edge-queue-cons',
          type: 'HTTP',
          sourceId: 'kafka-queue',
          targetId: 'consumer-service',
        },
      ],
      chaosScript: [
        {
          atSec: 15,
          action: { type: 'KILL_NODE', targetId: 'consumer-service' },
        },
        {
          atSec: 45,
          action: { type: 'RECOVER_NODE', targetId: 'consumer-service' },
        },
      ],
      walkthroughScript: [
        {
          atSec: 25,
          pause: true,
          question:
            'The Consumer Service is dead, and the queue depth is rising. What happens when the message queue reaches its maxQueueDepth limit?',
          options: [
            'It routes messages to PostgreSQL',
            'Producers experience backpressure and fail to publish, blocking upstream requests',
            'The queue deletes old messages automatically',
            'Kafka restarts the consumer',
          ],
          correct: 1,
        },
        {
          atSec: 50,
          pause: true,
          question:
            'Now that the Consumer Service has recovered, the backlog is draining. What is the main advantage of having a message queue buffer here?',
          options: [
            'It guarantees strict instantaneous execution',
            'It allows the system to absorb high ingestion spikes and process them asynchronously without losing messages',
            'It eliminates database reads',
            'It reduces CPU usage to 0%',
          ],
          correct: 1,
        },
      ],
    },
    {
      name: 'The Memory Leak',
      category: 'MEMORY_LEAK',
      difficulty: 'INTERMEDIATE',
      description:
        'A slow memory leak in the service heap causes memory usage to climb continuously until an Out-Of-Memory (OOM) crash restarts the process, repeating the cycle.',
      isBuiltIn: true,
      nodesJson: [
        {
          id: 'api-gateway',
          type: 'API_GATEWAY',
          label: 'API Gateway',
          x: 100,
          y: 200,
        },
        {
          id: 'leak-service',
          type: 'SERVICE',
          label: 'Leak Service',
          x: 350,
          y: 200,
          replicas: 1,
          processingTimeMs: 40,
        },
        {
          id: 'postgres-db',
          type: 'DATABASE',
          label: 'PostgreSQL DB',
          x: 600,
          y: 200,
          dbType: 'POSTGRESQL',
        },
      ],
      edgesJson: [
        {
          id: 'edge-gw-leak',
          type: 'HTTP',
          sourceId: 'api-gateway',
          targetId: 'leak-service',
        },
        {
          id: 'edge-leak-db',
          type: 'DATABASE_CONN',
          sourceId: 'leak-service',
          targetId: 'postgres-db',
        },
      ],
      chaosScript: [
        {
          atSec: 15,
          action: { type: 'MEMORY_PRESSURE', targetId: 'leak-service' },
        },
      ],
      walkthroughScript: [
        {
          atSec: 25,
          pause: true,
          question:
            'Leak Service memory is climbing. What happens when it hits 100% memory usage?',
          options: [
            'The database shuts down',
            "The operating system's OOM Killer will crash the process, causing a temporary outage until it restarts",
            'It automatically doubles its physical RAM',
            'It switches to using static files instead',
          ],
          correct: 1,
        },
      ],
    },
    {
      name: 'Traffic Spike Survival',
      category: 'TRAFFIC_SPIKE',
      difficulty: 'ADVANCED',
      description:
        'A massive 10x traffic spike tests the system limits. Your service replication and database pool sizes determine whether you survive or crash.',
      isBuiltIn: true,
      nodesJson: [
        {
          id: 'api-gateway',
          type: 'API_GATEWAY',
          label: 'API Gateway',
          x: 100,
          y: 200,
        },
        {
          id: 'load-balancer',
          type: 'LOAD_BALANCER',
          label: 'Load Balancer',
          x: 250,
          y: 200,
          algorithm: 'ROUND_ROBIN',
        },
        {
          id: 'web-service',
          type: 'SERVICE',
          label: 'Web Service',
          x: 450,
          y: 120,
          replicas: 2,
          processingTimeMs: 30,
        },
        {
          id: 'api-service',
          type: 'SERVICE',
          label: 'API Service',
          x: 450,
          y: 280,
          replicas: 2,
          processingTimeMs: 50,
        },
        {
          id: 'postgres-db',
          type: 'DATABASE',
          label: 'PostgreSQL DB',
          x: 680,
          y: 200,
          dbType: 'POSTGRESQL',
          connectionPoolSize: 10,
        },
      ],
      edgesJson: [
        {
          id: 'edge-gw-lb',
          type: 'HTTP',
          sourceId: 'api-gateway',
          targetId: 'load-balancer',
        },
        {
          id: 'edge-lb-web',
          type: 'HTTP',
          sourceId: 'load-balancer',
          targetId: 'web-service',
        },
        {
          id: 'edge-lb-api',
          type: 'HTTP',
          sourceId: 'load-balancer',
          targetId: 'api-service',
        },
        {
          id: 'edge-web-db',
          type: 'DATABASE_CONN',
          sourceId: 'web-service',
          targetId: 'postgres-db',
        },
        {
          id: 'edge-api-db',
          type: 'DATABASE_CONN',
          sourceId: 'api-service',
          targetId: 'postgres-db',
        },
      ],
      chaosScript: [
        {
          atSec: 15,
          action: { type: 'TRAFFIC_SPIKE', targetId: 'api-gateway', value: 10 },
        },
      ],
      walkthroughScript: [
        {
          atSec: 25,
          pause: true,
          question:
            'A 10x traffic spike has hit the entry gateway. Under heavy load, which bottleneck is most likely to fail first if not scaled properly?',
          options: [
            'The API Gateway itself',
            'The Database (due to connection pool exhaustion) or Web/API Services (due to CPU limits)',
            'The animated canvas links',
            'The static files hosting',
          ],
          correct: 1,
        },
      ],
    },
  ];

  for (const s of scenarios) {
    await prisma.scenario.upsert({
      where: { id: s.name.replace(/\s+/g, '-').toLowerCase() },
      create: {
        id: s.name.replace(/\s+/g, '-').toLowerCase(),
        name: s.name,
        description: s.description,
        category: s.category,
        difficulty: s.difficulty,
        nodesJson: s.nodesJson,
        edgesJson: s.edgesJson,
        chaosScript: s.chaosScript,
        walkthroughScript: s.walkthroughScript,
        isBuiltIn: s.isBuiltIn,
      },
      update: {
        description: s.description,
        category: s.category,
        difficulty: s.difficulty,
        nodesJson: s.nodesJson,
        edgesJson: s.edgesJson,
        chaosScript: s.chaosScript,
        walkthroughScript: s.walkthroughScript,
      },
    });
  }

  console.log('Successfully seeded 8 pre-built scenarios!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
