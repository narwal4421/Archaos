import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import OpenAI from 'openai';
import type {
  ChatCompletionChunk,
  ChatCompletionMessageParam,
} from 'openai/resources/chat/completions';
import type { Stream } from 'openai/streaming';

const FIRST_TOKEN_TIMEOUT_MS = 5000;

/** Per-client sliding-window rate limiter: max N events per window (ms). */
interface RateLimitEntry {
  timestamps: number[];
}

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
      'https://archaos-tau.vercel.app',
      ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
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

  private readonly logger = new Logger(NarrationGateway.name);

  // Rate limiting: max 5 narration events per 30-second window per client
  private readonly rateLimitWindowMs = 30_000;
  private readonly rateLimitMaxEvents = 5;
  private rateLimitMap = new Map<string, RateLimitEntry>();

  private getProviderInfo() {
    const orKey = process.env.OPENROUTER_API_KEY;
    if (
      orKey &&
      orKey.trim() !== '' &&
      orKey !== 'your_openrouter_key_here' &&
      !orKey.startsWith('sk-or-...')
    ) {
      return { key: orKey, isOpenRouter: true };
    }
    const oaKey = process.env.OPENAI_API_KEY;
    if (
      oaKey &&
      oaKey.trim() !== '' &&
      oaKey !== 'your_openai_key_here' &&
      !oaKey.startsWith('sk-...')
    ) {
      return { key: oaKey, isOpenRouter: false };
    }
    return null;
  }

  private getOpenAIClient(): OpenAI | null {
    const provider = this.getProviderInfo();
    this.logger.debug(
      `AI provider configured: ${provider ? (provider.isOpenRouter ? 'OpenRouter' : 'OpenAI') : 'none (demo mode)'}`,
    );
    if (!provider) return null;
    return new OpenAI({
      apiKey: provider.key,
      baseURL: provider.isOpenRouter
        ? 'https://openrouter.ai/api/v1'
        : undefined,
    });
  }

  /** Returns true if the client is within rate limit, false if throttled. */
  private checkRateLimit(clientId: string): boolean {
    const now = Date.now();
    const entry = this.rateLimitMap.get(clientId) ?? { timestamps: [] };

    // Purge timestamps outside the window
    entry.timestamps = entry.timestamps.filter(
      (t) => now - t < this.rateLimitWindowMs,
    );

    if (entry.timestamps.length >= this.rateLimitMaxEvents) {
      this.logger.warn(
        `Client ${clientId} exceeded narration rate limit (${this.rateLimitMaxEvents} req/${this.rateLimitWindowMs / 1000}s)`,
      );
      return false;
    }

    entry.timestamps.push(now);
    this.rateLimitMap.set(clientId, entry);
    return true;
  }

  handleConnection(client: Socket): void {
    this.logger.log(`Narration client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`Narration client disconnected: ${client.id}`);
    this.rateLimitMap.delete(client.id);
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
    if (!this.checkRateLimit(client.id)) {
      client.emit('narration:error', {
        message: 'Too many narration requests. Please wait a moment.',
        code: 'RATE_LIMITED',
      });
      return;
    }

    try {
      await this.streamNarration(client, data.event, data.state, data.topology);
    } catch (err) {
      this.logger.error(
        'Narration stream error',
        err instanceof Error ? err.stack : String(err),
      );
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
    const openaiClient = this.getOpenAIClient();
    if (!openaiClient) {
      this.logger.warn('No AI API key configured — serving demo narration');
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

    const siteReferer =
      process.env.SITE_REFERER ?? 'https://archaos.vercel.app';

    const attemptStream = async (
      model: string,
    ): Promise<Stream<ChatCompletionChunk>> => {
      return openaiClient.chat.completions.create(
        {
          model,
          stream: true,
          response_format: { type: 'json_object' },
          messages,
        },
        {
          headers: {
            'HTTP-Referer': siteReferer,
            'X-Title': 'Archaos',
          },
        },
      );
    };

    const provider = this.getProviderInfo();
    const DYNAMIC_MODELS = provider?.isOpenRouter
      ? { primary: 'openai/gpt-4o-mini', fallback: 'moonshotai/kimi-k2.6' }
      : { primary: 'gpt-4o-mini', fallback: 'gpt-3.5-turbo' };

    let modelUsed: string = DYNAMIC_MODELS.primary;
    let stream: Stream<ChatCompletionChunk>;
    const fullResponse: string[] = [];

    try {
      stream = await attemptStream(DYNAMIC_MODELS.primary);
      modelUsed = DYNAMIC_MODELS.primary;
    } catch (initErr: unknown) {
      const status = (initErr as { status?: number }).status;
      this.logger.warn(
        `Primary model ${DYNAMIC_MODELS.primary} failed (${status?.toString() ?? 'unknown'}) — switching to fallback`,
      );
      stream = await attemptStream(DYNAMIC_MODELS.fallback);
      modelUsed = DYNAMIC_MODELS.fallback;
    }

    client.emit('narration:model', { model: modelUsed });

    let iterator = stream[Symbol.asyncIterator]();
    let firstPart: IteratorResult<ChatCompletionChunk>;

    try {
      if (modelUsed === DYNAMIC_MODELS.primary) {
        const nextPromise = iterator.next();
        let timeoutId: NodeJS.Timeout;
        const timeoutPromise = new Promise<null>((resolve) => {
          timeoutId = setTimeout(() => resolve(null), FIRST_TOKEN_TIMEOUT_MS);
        });
        const result = await Promise.race([nextPromise, timeoutPromise]);
        clearTimeout(timeoutId!);

        if (result === null) {
          this.logger.warn(
            `Primary model too slow (>${FIRST_TOKEN_TIMEOUT_MS}ms) — switching to fallback`,
          );
          modelUsed = DYNAMIC_MODELS.fallback;
          client.emit('narration:model', { model: modelUsed });
          const fallback = await attemptStream(DYNAMIC_MODELS.fallback);
          iterator = fallback[Symbol.asyncIterator]();
          firstPart = await iterator.next();
        } else {
          firstPart = result;
        }
      } else {
        firstPart = await iterator.next();
      }
    } catch (err) {
      this.logger.warn(
        `Stream start error: ${String(err)} — switching to fallback`,
      );
      if (modelUsed === DYNAMIC_MODELS.primary) {
        try {
          modelUsed = DYNAMIC_MODELS.fallback;
          client.emit('narration:model', { model: modelUsed });
          const fallback = await attemptStream(DYNAMIC_MODELS.fallback);
          iterator = fallback[Symbol.asyncIterator]();
          firstPart = await iterator.next();
        } catch (fbErr) {
          this.logger.error(
            'Fallback model also failed to start',
            String(fbErr),
          );
          client.emit('narration:error', {
            message: 'Narration models unavailable. Try again in a moment.',
          });
          return;
        }
      } else {
        client.emit('narration:error', {
          message: 'Narration model failed to start.',
        });
        return;
      }
    }

    try {
      let currentResult = firstPart;
      while (!currentResult.done) {
        const part = currentResult.value;
        const token = part.choices[0]?.delta?.content ?? '';
        if (token) {
          fullResponse.push(token);
          client.emit('narration:token', { token });
        }
        currentResult = await iterator.next();
      }
    } catch (streamReadErr) {
      this.logger.warn('Stream interrupted mid-way:', String(streamReadErr));
      if (modelUsed === DYNAMIC_MODELS.primary) {
        this.logger.warn('Primary stream died mid-way — switching to fallback');
        try {
          const recovery = await attemptStream(DYNAMIC_MODELS.fallback);
          modelUsed = DYNAMIC_MODELS.fallback;
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
