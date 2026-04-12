import { z } from "zod";

export const kernelCommandSchema = z.enum([
  "inspect.status",
  "inspect.processes",
  "task.run",
  "task.manage",
  "module.manage",
]);

export type KernelCommand = z.infer<typeof kernelCommandSchema>;

export const kernelTaskSchema = z.object({
  id: z.string(),
  command: z.string(),
  status: z.enum(["queued", "running", "completed"]),
  createdAt: z.string(),
});

export type KernelTask = z.infer<typeof kernelTaskSchema>;

export const kernelModuleSchema = z.object({
  id: z.string(),
  name: z.string(),
  mutable: z.boolean(),
  state: z.enum(["active", "inactive"]),
});

export type KernelModule = z.infer<typeof kernelModuleSchema>;

export const statusSnapshotSchema = z.object({
  cpu: z.number(),
  memory: z.number(),
  modules: z.array(kernelModuleSchema),
  uptime: z.number(),
  taskCount: z.number(),
});

export type StatusSnapshot = z.infer<typeof statusSnapshotSchema>;

export const inspectStatusRequestSchema = z.object({
  type: z.literal("inspect.status"),
});

export const inspectProcessesRequestSchema = z.object({
  type: z.literal("inspect.processes"),
});

export const taskRunRequestSchema = z.object({
  type: z.literal("task.run"),
  payload: z.object({
    command: z.string().min(1),
  }),
});

export const taskManageRequestSchema = z.object({
  type: z.literal("task.manage"),
  payload: z.object({
    action: z.enum(["stop", "resume"]),
    taskId: z.string().min(1),
  }),
});

export const moduleManageRequestSchema = z.object({
  type: z.literal("module.manage"),
  payload: z.object({
    moduleId: z.string().min(1),
    enabled: z.boolean(),
  }),
});

export const kernelRequestSchema = z.discriminatedUnion("type", [
  inspectStatusRequestSchema,
  inspectProcessesRequestSchema,
  taskRunRequestSchema,
  taskManageRequestSchema,
  moduleManageRequestSchema,
]);

export type KernelRequest = z.infer<typeof kernelRequestSchema>;

const kernelResponseBaseSchema = z.object({
  ok: z.boolean(),
  channel: z.literal("ui.bridge"),
  type: kernelCommandSchema,
  timestamp: z.string(),
});

export const kernelSuccessResponseSchema = kernelResponseBaseSchema.extend({
  ok: z.literal(true),
  data: z.unknown(),
});

export const kernelFailureResponseSchema = kernelResponseBaseSchema.extend({
  ok: z.literal(false),
  error: z.string(),
});

export const kernelResponseSchema = z.union([
  kernelSuccessResponseSchema,
  kernelFailureResponseSchema,
]);

export type KernelResponse = z.infer<typeof kernelResponseSchema>;

export const kernelEventSchema = z.object({
  event: z.enum(["kernel.log", "kernel.task", "kernel.notification"]),
  timestamp: z.string(),
  payload: z.unknown(),
});

export type KernelEvent = z.infer<typeof kernelEventSchema>;

export const responseDataSchemas = {
  "inspect.status": statusSnapshotSchema,
  "inspect.processes": z.array(kernelTaskSchema),
  "task.run": kernelTaskSchema,
  "task.manage": kernelTaskSchema,
  "module.manage": kernelModuleSchema,
} as const;

export type KernelResponseMap = {
  "inspect.status": StatusSnapshot;
  "inspect.processes": KernelTask[];
  "task.run": KernelTask;
  "task.manage": KernelTask;
  "module.manage": KernelModule;
};
