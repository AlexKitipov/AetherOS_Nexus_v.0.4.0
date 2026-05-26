import { z } from 'zod';
import { insertConversationSchema, insertMessageSchema, conversations, messages } from './models/chat';
import { kernelModuleSchema, kernelRequestSchema, kernelResponseSchema, kernelTaskSchema, statusSnapshotSchema } from './kernelAbi';

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
        200: statusSnapshotSchema,
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
      input: kernelRequestSchema,
      responses: {
        200: kernelResponseSchema,
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
