import type { Express } from "express";
import { type Server } from "http";
import { registerChatRoutes } from "./replit_integrations/chat/routes";
import { chatStorage } from "./replit_integrations/chat/storage";
import { createInterfaceSession, NexusKernelBridge } from "./kernel/bridge";
import { api } from "@shared/routes";

const kernelBridge = new NexusKernelBridge();
const uiSession = createInterfaceSession("operator");

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Register the AI Chat integration routes
  registerChatRoutes(app);

  // Legacy system status endpoint kept for compatibility.
  app.get(api.system.status.path, (_req, res) => {
    const status = kernelBridge.getStatusSnapshot();

    res.json({
      cpu: status.cpu,
      memory: status.memory,
      modules: status.modules.map((module) => module.name),
      uptime: status.uptime,
    });
  });

  app.get(api.kernel.status.path, (_req, res) => {
    res.json(kernelBridge.getStatusSnapshot());
  });

  app.get(api.kernel.processes.path, (_req, res) => {
    res.json(kernelBridge.getTaskSnapshot());
  });

  app.post(api.kernel.command.path, (req, res) => {
    const command = req.body;
    const response = kernelBridge.dispatch(uiSession, command);

    const status = response.ok ? 200 : 403;
    res.status(status).json(response);
  });

  // Seed initial conversation if none exists
  try {
    const conversations = await chatStorage.getAllConversations();
    if (conversations.length === 0) {
      const conv = await chatStorage.createConversation("Welcome to Aether OS");
      await chatStorage.createMessage(conv.id, "assistant", "Welcome to Aether OS Nexus Core v0.1. I am your system AI assistant. How can I help you explore this environment?");
      console.log("Seeded initial conversation");
    }
  } catch (err) {
    console.error("Error seeding database:", err);
  }

  return httpServer;
}
