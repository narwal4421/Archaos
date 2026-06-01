import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import OpenAI from 'openai';
import type {
  ChatCompletionChunk,
  ChatCompletionMessageParam,
} from 'openai/resources/chat/completions';
import type { Stream } from 'openai/streaming';

const MODELS = {
  primary: 'openai/gpt-oss-120b',
  fallback: 'moonshotai/kimi-k2.6',
} as const;

type ModelKey = (typeof MODELS)[keyof typeof MODELS];

const FIRST_TOKEN_TIMEOUT_MS = 5000;

interface NarrationEvent {
  type?: string;
  nodeId?: string;
  message?: string;
}

interface DemoNarration {
  narration: string;
  concept: string;
  prediction: string;
  watchFor: string;
}

@WebSocketGateway({
  cors: {
    origin: [
      'http://localhost:5173',
      'http://localhost:3000',
      'https://archaos.vercel.app',
    ],
    credentials: true,
  },
  namespace: 'narration',
})
export class NarrationGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private openai = new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY ?? process.env.OPENAI_API_KEY ?? '',
    baseURL: 'https://openrouter.ai/api/v1',
  });

  private lastNarrationTime = new Map<string, number>();
  private readonly narrationCooldownMs = 5000;

  handleConnection(client: Socket): void {
    console.log(`Narration client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket): void {
    console.log(`Narration client disconnected: ${client.id}`);
    this.lastNarrationTime.delete(client.id);
  }

  @SubscribeMessage('narration:subscribe')
  handleSubscribe(
    @MessageBody() data: { sessionId: string },
    @ConnectedSocket() client: Socket,
  ): void {
    void client.join(`session:${data.sessionId}`);
    client.emit('narration:subscribed', { sessionId: data.sessionId });
  }

  @SubscribeMessage('narration:event')
  async handleNarrationEvent(
    @MessageBody()
    data: { event: NarrationEvent; state: unknown; topology: unknown },
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    const now = Date.now();
    const lastTime = this.lastNarrationTime.get(client.id) ?? 0;
    if (now - lastTime < this.narrationCooldownMs) {
      return;
    }
    this.lastNarrationTime.set(client.id, now);

    try {
      await this.streamNarration(client, data.event, data.state, data.topology);
    } catch (err) {
      console.error('Narration error:', err);
      client.emit('narration:error', {
        message: 'Failed to generate narration',
      });
    }
  }

  private async streamNarration(
    client: Socket,
    event: NarrationEvent,
    state: unknown,
    topology: unknown,
  ): Promise<void> {
    const hasApiKey =
      Boolean(process.env.OPENROUTER_API_KEY) ||
      Boolean(process.env.OPENAI_API_KEY);

    if (!hasApiKey) {
      const demo = this.generateDemoNarration(event);
      client.emit('narration:token', { token: JSON.stringify(demo) });
      client.emit('narration:done', {
        concept: demo.concept,
        prediction: demo.prediction,
        watchFor: demo.watchFor,
        modelUsed: 'demo',
      });
      return;
    }

    const systemPrompt = `You are the AI narrator for Archaos, a distributed systems simulator.
You watch a live simulation and explain what is happening to an engineering student.

Your narration must be:
1. SPECIFIC — name exact nodes, exact metrics, exact numbers from the state
2. PREDICTIVE — tell the student what to watch for in the next 10-30 seconds
3. EDUCATIONAL — name the distributed systems pattern or concept this represents
4. CAUSAL — explain WHY this is happening, not just WHAT is happening

Format your response as JSON:
{
  "narration": "2-3 sentence explanation of what just happened",
  "concept": "name of the distributed systems concept (e.g., 'Cascading Failure', 'Circuit Breaker Pattern', 'Retry Storm', 'Thundering Herd', 'Split Brain', 'Eventual Consistency', 'Backpressure')",
  "prediction": "1-2 sentence prediction of what will happen next with a time estimate",
  "watchFor": "one specific metric or node to watch that will confirm the prediction"
}

Be specific about numbers. Reference exact node names from the topology.
Never be generic. Every word should describe THIS specific topology's current state.`;

    const userMessage = [
      `Current simulation state:\n${JSON.stringify(state, null, 2)}`,
      `Topology (node names and connections):\n${JSON.stringify(topology, null, 2)}`,
      `Event that just occurred:\n${JSON.stringify(event, null, 2)}`,
      'Generate narration for this event.',
    ].join('\n\n');

    const messages: ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ];

    const attemptStream = async (
      model: string,
    ): Promise<Stream<ChatCompletionChunk>> => {
      return this.openai.chat.completions.create(
        {
          model,
          stream: true,
          response_format: { type: 'json_object' },
          messages,
        },
        {
          headers: {
            'HTTP-Referer': 'https://archaos.dev',
            'X-Title': 'Archaos',
          },
        },
      );
    };

    let modelUsed: ModelKey = MODELS.primary;
    let stream: Stream<ChatCompletionChunk>;
    let fallbackStream: Stream<ChatCompletionChunk> | null = null;
    let firstTokenReceived = false;
    const fullResponse: string[] = [];

    try {
      stream = await attemptStream(MODELS.primary);
      modelUsed = MODELS.primary;
    } catch (initErr: unknown) {
      const status = (initErr as { status?: number }).status;
      console.warn(
        `Primary model failed: ${status?.toString() ?? 'unknown'} — switching to fallback`,
      );
      stream = await attemptStream(MODELS.fallback);
      modelUsed = MODELS.fallback;
    }

    client.emit('narration:model', { model: modelUsed });

    const firstTokenTimer = setTimeout(() => {
      if (!firstTokenReceived && modelUsed === MODELS.primary) {
        console.warn('Primary model too slow — switching to fallback');
        void attemptStream(MODELS.fallback)
          .then((fb) => {
            fallbackStream = fb;
            modelUsed = MODELS.fallback;
            client.emit('narration:model', { model: modelUsed });
          })
          .catch((fallbackErr: unknown) => {
            console.error('Fallback model also failed:', fallbackErr);
            client.emit('narration:error', {
              message: 'Both models unavailable. Try again in a moment.',
            });
          });
      }
    }, FIRST_TOKEN_TIMEOUT_MS);

    const activeStream = fallbackStream ?? stream;

    try {
      for await (const part of activeStream) {
        const token = part.choices[0]?.delta?.content ?? '';
        if (!token) continue;
        if (!firstTokenReceived) {
          firstTokenReceived = true;
          clearTimeout(firstTokenTimer);
        }
        fullResponse.push(token);
        client.emit('narration:token', { token });
      }
    } catch {
      if (modelUsed === MODELS.primary && !fallbackStream) {
        console.warn('Primary stream died mid-way — switching to fallback');
        clearTimeout(firstTokenTimer);
        try {
          const recovery = await attemptStream(MODELS.fallback);
          modelUsed = MODELS.fallback;
          client.emit('narration:model', { model: modelUsed });
          for await (const part of recovery) {
            const token = part.choices[0]?.delta?.content ?? '';
            if (token) {
              fullResponse.push(token);
              client.emit('narration:token', { token });
            }
          }
        } catch {
          client.emit('narration:error', {
            message: 'Narration unavailable. Please try again.',
          });
          return;
        }
      }
    }

    clearTimeout(firstTokenTimer);

    try {
      const fullText = fullResponse.join('');
      const parsed = JSON.parse(fullText) as {
        concept?: string;
        prediction?: string;
        watchFor?: string;
      };
      client.emit('narration:done', {
        concept: parsed.concept ?? 'Distributed Systems Event',
        prediction: parsed.prediction ?? '',
        watchFor: parsed.watchFor ?? '',
        modelUsed,
      });
    } catch {
      client.emit('narration:done', {
        concept: 'System Event',
        prediction: '',
        watchFor: '',
        modelUsed,
      });
    }
  }

  private generateDemoNarration(event: NarrationEvent): DemoNarration {
    const eventType = event.type ?? 'UNKNOWN';
    const nodeId = event.nodeId ?? 'a service';

    const narrationsMap: Record<string, DemoNarration> = {
      CHAOS_INJECTED: {
        narration: `Chaos has been injected targeting ${nodeId}. The system is now under stress — watch for cascading effects as upstream services begin to see increased error rates and latency.`,
        concept: 'Chaos Engineering',
        prediction: `Within the next 10-20 seconds, services that depend on ${nodeId} will begin experiencing degraded performance as their requests queue up or fail.`,
        watchFor: `Error rate on services directly upstream of ${nodeId}`,
      },
      NODE_STATE_CHANGE: {
        narration: `${nodeId} has changed health state. This transition reflects a real threshold being crossed — the system's own metrics triggered this state change, not a manual action.`,
        concept: 'Cascading Failure',
        prediction:
          'Watch for upstream callers to start experiencing elevated error rates as they call the degraded service without protection.',
        watchFor: `Circuit breaker state on edges pointing to ${nodeId}`,
      },
      CIRCUIT_BREAKER: {
        narration: `A circuit breaker has changed state. This is the distributed systems equivalent of a fuse blowing — the system is choosing to fail fast rather than queue up more failing requests.`,
        concept: 'Circuit Breaker Pattern',
        prediction:
          'With the circuit open, the upstream service will stop waiting and fail fast. Error rates will spike briefly, then stabilize as callers stop queueing.',
        watchFor:
          'System-wide p99 latency — it should start decreasing as callers stop waiting',
      },
    };

    return (
      narrationsMap[eventType] ?? {
        narration: `A significant system event occurred: ${event.message ?? 'state change detected'}. The simulation is capturing real distributed system behavior.`,
        concept: 'Distributed Systems Resilience',
        prediction:
          'Monitor adjacent services for cascading effects over the next 15-30 seconds.',
        watchFor: 'System-wide error rate trend',
      }
    );
  }
}
