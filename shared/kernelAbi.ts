import { z } from "zod";

/**
 * Unified Kernel syscall/bridge ABI.
 *
 * Syscall numbers:
 * 1 = inspect.status
 * 2 = inspect.processes
 * 3 = task.run
 * 4 = task.manage
 * 5 = module.manage
 *
 * Argument conventions:
 * - Each request has a discriminant `type` and optional `payload`.
 * - `payload` is required for mutating calls (`task.run`, `task.manage`, `module.manage`).
 *
 * Return value conventions:
 * - Every response includes `ok`, `channel`, `type`, and `timestamp`.
 * - Success returns `ok: true` with `data`.
 * - Failure returns `ok: false` with `error`.
 *
 * Capability requirements:
 * - inspect.* => kernel.inspect
 * - task.run => task.run
 * - task.manage => task.manage
 * - module.manage => module.manage
 */

export const KERNEL_CHANNEL = "ui.bridge" as const;

export const kernelSyscallNumberByType = {
  "inspect.status": 1,
  "inspect.processes": 2,
  "task.run": 3,
  "task.manage": 4,
  "module.manage": 5,
} as const;

export const kernelErrorCodeSchema = z.enum([
  "UNAUTHORIZED",
  "UNSUPPORTED_COMMAND",
  "NOT_FOUND",
  "IMMUTABLE_MODULE",
  "VALIDATION_FAILED",
  "BRIDGE_FAILURE",
]);

export const kernelCapabilitySchema = z.enum([
  "kernel.inspect",
  "task.run",
  "task.manage",
  "module.manage",
]);

export type KernelCapability = z.infer<typeof kernelCapabilitySchema>;

export const kernelCommandTypeSchema = z.enum(Object.keys(kernelSyscallNumberByType) as [keyof typeof kernelSyscallNumberByType, ...(keyof typeof kernelSyscallNumberByType)[]]);

export const kernelModuleSchema = z.object({
  id: z.string(),
  name: z.string(),
  mutable: z.boolean(),
  state: z.enum(["active", "inactive"]),
});

export const kernelTaskSchema = z.object({
  id: z.string(),
  command: z.string(),
  status: z.enum(["queued", "running", "completed"]),
  createdAt: z.string(),
});

export const statusSnapshotSchema = z.object({
  cpu: z.number(),
  memory: z.number(),
  modules: z.array(kernelModuleSchema),
  uptime: z.number(),
  taskCount: z.number(),
});

export const inspectStatusRequestSchema = z.object({ type: z.literal("inspect.status") });
export const inspectProcessesRequestSchema = z.object({ type: z.literal("inspect.processes") });
export const taskRunRequestSchema = z.object({ type: z.literal("task.run"), payload: z.object({ command: z.string().min(1) }) });
export const taskManageRequestSchema = z.object({ type: z.literal("task.manage"), payload: z.object({ action: z.enum(["stop", "resume"]), taskId: z.string().min(1) }) });
export const moduleManageRequestSchema = z.object({ type: z.literal("module.manage"), payload: z.object({ moduleId: z.string().min(1), enabled: z.boolean() }) });

export const kernelRequestSchema = z.discriminatedUnion("type", [
  inspectStatusRequestSchema,
  inspectProcessesRequestSchema,
  taskRunRequestSchema,
  taskManageRequestSchema,
  moduleManageRequestSchema,
]);

export const kernelResponseBaseSchema = z.object({
  ok: z.boolean(),
  channel: z.literal(KERNEL_CHANNEL),
  type: kernelCommandTypeSchema,
  timestamp: z.string(),
});

export const kernelSuccessResponseSchema = kernelResponseBaseSchema.extend({ ok: z.literal(true), data: z.unknown() });
export const kernelFailureResponseSchema = kernelResponseBaseSchema.extend({ ok: z.literal(false), error: z.string(), code: kernelErrorCodeSchema.optional() });
export const kernelResponseSchema = z.union([kernelSuccessResponseSchema, kernelFailureResponseSchema]);

export const responseDataSchemas = {
  "inspect.status": statusSnapshotSchema,
  "inspect.processes": z.array(kernelTaskSchema),
  "task.run": kernelTaskSchema,
  "task.manage": kernelTaskSchema,
  "module.manage": kernelModuleSchema,
} as const;

export type KernelCommand = z.infer<typeof kernelCommandTypeSchema>;
export type KernelRequest = z.infer<typeof kernelRequestSchema>;
export type KernelResponse = z.infer<typeof kernelResponseSchema>;
export type KernelTask = z.infer<typeof kernelTaskSchema>;
export type KernelModule = z.infer<typeof kernelModuleSchema>;
export type StatusSnapshot = z.infer<typeof statusSnapshotSchema>;

export type KernelResponseMap = {
  "inspect.status": StatusSnapshot;
  "inspect.processes": KernelTask[];
  "task.run": KernelTask;
  "task.manage": KernelTask;
  "module.manage": KernelModule;
};
