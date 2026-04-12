import { TransportKernelBridge, type KernelBridge } from "@/bridge/KernelBridge";
import { FetchTransport, MockTransport } from "@/bridge/transport";
import { MockKernelBackend } from "@/mock/MockKernel";

function createBridge(): KernelBridge {
  if (import.meta.env.DEV || import.meta.env.VITE_USE_MOCK_KERNEL === "true") {
    const mockKernel = new MockKernelBackend();
    return new TransportKernelBridge(new MockTransport(mockKernel.handle.bind(mockKernel), mockKernel.subscribe.bind(mockKernel)));
  }

  return new TransportKernelBridge(new FetchTransport("/api/kernel/bridge"));
}

export const kernelBridge = createBridge();

export * from "@/types/kernel";
export * from "@/bridge/KernelBridge";
export * from "@/bridge/errors";
export * from "@/bridge/transport";
export * from "@/mock/MockKernel";
