import { z } from 'zod';
import { insertConversationSchema, insertMessageSchema, conversations, messages } from './models/chat';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

const kernelModuleSchema = z.object({
  id: z.string(),
  name: z.string(),
  mutable: z.boolean(),
  state: z.enum(['active', 'inactive']),
});

const kernelTaskSchema = z.object({
  id: z.string(),
  command: z.string(),
  status: z.enum(['queued', 'running', 'completed']),
  createdAt: z.string(),
});

const kernelCommandSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('inspect.status') }),
  z.object({ type: z.literal('inspect.processes') }),
  z.object({
    type: z.literal('task.run'),
    payload: z.object({
      command: z.string().min(1),
    }),
  }),
  z.object({
    type: z.literal('task.manage'),
    payload: z.object({
      action: z.enum(['stop', 'resume']),
      taskId: z.string(),
    }),
  }),
  z.object({
    type: z.literal('module.manage'),
    payload: z.object({
      moduleId: z.string(),
      enabled: z.boolean(),
    }),
  }),
]);

export const api = {
  chat: {
    listConversations: {
      method: 'GET' as const,
      path: '/api/conversations' as const,
      responses: {
        200: z.array(z.custom<typeof conversations.$inferSelect>()),
      },
    },
    createConversation: {
      method: 'POST' as const,
      path: '/api/conversations' as const,
      input: z.object({ title: z.string().optional() }),
      responses: {
        201: z.custom<typeof conversations.$inferSelect>(),
      },
    },
    getConversation: {
      method: 'GET' as const,
      path: '/api/conversations/:id' as const,
      responses: {
        200: z.custom<typeof conversations.$inferSelect & { messages: typeof messages.$inferSelect[] }>(),
        404: errorSchemas.notFound,
      },
    },
    deleteConversation: {
      method: 'DELETE' as const,
      path: '/api/conversations/:id' as const,
      responses: {
        204: z.void(),
      },
    },
    sendMessage: {
      method: 'POST' as const,
      path: '/api/conversations/:id/messages' as const,
      input: z.object({ content: z.string() }),
      responses: {
        // This endpoint streams, but initially returns a 200 OK to start the stream
        200: z.void(),
      },
    },
  },
  system: {
    status: {
      method: 'GET' as const,
      path: '/api/system/status' as const,
      responses: {
        200: z.object({
          cpu: z.number(),
          memory: z.number(),
          modules: z.array(z.string()),
          uptime: z.number(),
        }),
      },
    },
  },
  kernel: {
    status: {
      method: 'GET' as const,
      path: '/api/kernel/status' as const,
      responses: {
        200: z.object({
          cpu: z.number(),
          memory: z.number(),
          modules: z.array(kernelModuleSchema),
          uptime: z.number(),
          taskCount: z.number(),
        }),
      },
    },
    processes: {
      method: 'GET' as const,
      path: '/api/kernel/processes' as const,
      responses: {
        200: z.array(kernelTaskSchema),
      },
    },
    command: {
      method: 'POST' as const,
      path: '/api/kernel/command' as const,
      input: kernelCommandSchema,
      responses: {
        200: z.object({
          ok: z.boolean(),
          channel: z.literal('ui.bridge'),
          type: z.string(),
          timestamp: z.string(),
          data: z.unknown().optional(),
          error: z.string().optional(),
        }),
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
