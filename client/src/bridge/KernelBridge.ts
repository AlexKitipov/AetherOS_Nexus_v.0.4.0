import { BridgeError, normalizeBridgeError } from "@/bridge/errors";
import type { BridgeTransport } from "@/bridge/transport";
import {
  kernelEventSchema,
  kernelRequestSchema,
  kernelResponseSchema,
  responseDataSchemas,
  type KernelEvent,
  type KernelModule,
  type KernelRequest,
  type KernelResponseMap,
  type KernelTask,
  type StatusSnapshot,
} from "@/types/kernel";

type KernelEventListener = (event: KernelEvent) => void;

export interface KernelBridge {
  inspectStatus(): Promise<StatusSnapshot>;
  inspectProcesses(): Promise<KernelTask[]>;
  runTask(command: string): Promise<KernelTask>;
  manageTask(action: "stop" | "resume", taskId: string): Promise<KernelTask>;
  manageModule(moduleId: string, enabled: boolean): Promise<KernelModule>;
  subscribe(listener: KernelEventListener): () => void;
}

export class TransportKernelBridge implements KernelBridge {
  private readonly listeners = new Set<KernelEventListener>();
  private transportUnsubscribe: (() => void) | null = null;

  constructor(private readonly transport: BridgeTransport) {
    if (transport.subscribeEvents) {
      this.transportUnsubscribe = transport.subscribeEvents((rawEvent) => {
        const parsed = kernelEventSchema.safeParse(rawEvent);
        if (!parsed.success) {
          return;
        }

        this.listeners.forEach((listener) => listener(parsed.data));
      });
    }
  }

  inspectStatus(): Promise<StatusSnapshot> {
    return this.send("inspect.status");
  }

  inspectProcesses(): Promise<KernelTask[]> {
    return this.send("inspect.processes");
  }

  runTask(command: string): Promise<KernelTask> {
    return this.send("task.run", { command });
  }

  manageTask(action: "stop" | "resume", taskId: string): Promise<KernelTask> {
    return this.send("task.manage", { action, taskId });
  }

  manageModule(moduleId: string, enabled: boolean): Promise<KernelModule> {
    return this.send("module.manage", { moduleId, enabled });
  }

  subscribe(listener: KernelEventListener): () => void {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
      if (this.listeners.size === 0) {
        this.transportUnsubscribe?.();
        this.transportUnsubscribe = null;
      }
    };
  }

  private async send<T extends keyof KernelResponseMap>(
    type: T,
    payload?: Extract<KernelRequest, { type: T }> extends { payload: infer TPayload }
      ? TPayload
      : never,
  ): Promise<KernelResponseMap[T]> {
    try {
      const request = (payload ? { type, payload } : { type }) as KernelRequest;
      const validatedRequest = kernelRequestSchema.safeParse(request);

      if (!validatedRequest.success) {
        throw new BridgeError(
          "VALIDATION_ERROR",
          `Invalid request payload for '${type}': ${validatedRequest.error.message}`,
        );
      }

      const responsePayload = await this.transport.send(validatedRequest.data);
      const parsedResponse = kernelResponseSchema.safeParse(responsePayload);

      if (!parsedResponse.success) {
        throw new BridgeError("PARSING_ERROR", parsedResponse.error.message, parsedResponse.error);
      }

      const response = parsedResponse.data;
      if (!response.ok) {
        throw new BridgeError("BACKEND_ERROR", response.error);
      }

      const schema = responseDataSchemas[type];
      const parsedData = schema.safeParse(response.data);

      if (!parsedData.success) {
        throw new BridgeError(
          "PARSING_ERROR",
          `Unexpected response data for '${type}': ${parsedData.error.message}`,
        );
      }

      return parsedData.data as KernelResponseMap[T];
    } catch (error) {
      throw normalizeBridgeError(error);
    }
  }
}
