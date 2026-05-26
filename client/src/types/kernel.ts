import { z } from "zod";
import {
  inspectProcessesRequestSchema,
  inspectStatusRequestSchema,
  kernelCommandTypeSchema,
  kernelFailureResponseSchema,
  kernelModuleSchema,
  kernelRequestSchema,
  kernelResponseSchema,
  kernelSuccessResponseSchema,
  kernelTaskSchema,
  moduleManageRequestSchema,
  responseDataSchemas,
  statusSnapshotSchema,
  taskManageRequestSchema,
  taskRunRequestSchema,
  type KernelModule,
  type KernelRequest,
  type KernelResponse,
  type KernelResponseMap,
  type KernelTask,
  type StatusSnapshot,
} from "@shared/kernelAbi";

export const kernelCommandSchema = kernelCommandTypeSchema;
export type KernelCommand = z.infer<typeof kernelCommandSchema>;

export {
  kernelTaskSchema,
  kernelModuleSchema,
  statusSnapshotSchema,
  inspectStatusRequestSchema,
  inspectProcessesRequestSchema,
  taskRunRequestSchema,
  taskManageRequestSchema,
  moduleManageRequestSchema,
  kernelRequestSchema,
  kernelSuccessResponseSchema,
  kernelFailureResponseSchema,
  kernelResponseSchema,
  responseDataSchemas,
};

export type {
  KernelTask,
  KernelModule,
  StatusSnapshot,
  KernelRequest,
  KernelResponse,
  KernelResponseMap,
};

export const kernelEventSchema = z.object({
  event: z.enum(["kernel.log", "kernel.task", "kernel.notification"]),
  timestamp: z.string(),
  payload: z.unknown(),
});

export type KernelEvent = z.infer<typeof kernelEventSchema>;
