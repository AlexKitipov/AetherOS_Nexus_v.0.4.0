import type { KernelEvent, KernelRequest } from "@/types/kernel";

export type TransportEventUnsubscribe = () => void;

export interface BridgeTransport {
  send(request: KernelRequest): Promise<unknown>;
  subscribeEvents?(listener: (event: KernelEvent) => void): TransportEventUnsubscribe;
}

export class FetchTransport implements BridgeTransport {
  constructor(
    private readonly endpoint: string,
    private readonly init?: Omit<RequestInit, "body" | "method">,
  ) {}

  async send(request: KernelRequest): Promise<unknown> {
    const response = await fetch(this.endpoint, {
      ...this.init,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(this.init?.headers ?? {}),
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Bridge HTTP request failed with status ${response.status}`);
    }

    return response.json() as Promise<unknown>;
  }
}

export class WebSocketTransport implements BridgeTransport {
  private readonly socket: WebSocket;

  constructor(url: string) {
    this.socket = new WebSocket(url);
  }

  async send(request: KernelRequest): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const correlationId = `${Date.now()}-${Math.random()}`;

      const onMessage = (event: MessageEvent<string>) => {
        try {
          const parsed = JSON.parse(event.data) as { id?: string; response?: unknown };
          if (parsed.id !== correlationId) {
            return;
          }

          this.socket.removeEventListener("message", onMessage as EventListener);
          resolve(parsed.response);
        } catch (error) {
          this.socket.removeEventListener("message", onMessage as EventListener);
          reject(error);
        }
      };

      this.socket.addEventListener("message", onMessage as EventListener);
      this.socket.send(JSON.stringify({ id: correlationId, request }));
    });
  }

  subscribeEvents(listener: (event: KernelEvent) => void): TransportEventUnsubscribe {
    const onMessage = (event: MessageEvent<string>) => {
      try {
        const parsed = JSON.parse(event.data) as { event?: KernelEvent };
        if (parsed.event) {
          listener(parsed.event);
        }
      } catch {
        // Ignore malformed event payloads.
      }
    };

    this.socket.addEventListener("message", onMessage as EventListener);
    return () => this.socket.removeEventListener("message", onMessage as EventListener);
  }
}

export class MockTransport implements BridgeTransport {
  constructor(
    private readonly handler: (request: KernelRequest) => Promise<unknown> | unknown,
    private readonly subscribe?: (listener: (event: KernelEvent) => void) => TransportEventUnsubscribe,
  ) {}

  async send(request: KernelRequest): Promise<unknown> {
    return this.handler(request);
  }

  subscribeEvents(listener: (event: KernelEvent) => void): TransportEventUnsubscribe {
    if (!this.subscribe) {
      return () => undefined;
    }

    return this.subscribe(listener);
  }
}
