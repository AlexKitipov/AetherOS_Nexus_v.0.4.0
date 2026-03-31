import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { registerChatRoutes } from "./replit_integrations/chat/routes";
import { chatStorage } from "./replit_integrations/chat/storage";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Register the AI Chat integration routes
  registerChatRoutes(app);

  // System Status Mock API
  app.get("/api/system/status", (req, res) => {
    // Simulate fluctuating system stats
    const cpu = 10 + Math.random() * 20; // 10-30%
    const memory = 25 + Math.random() * 10; // 25-35%
    const uptime = process.uptime();
    
    res.json({
      cpu: Math.round(cpu),
      memory: Math.round(memory),
      modules: ["Hybrid Kernel", "AI Core", "Driver Sandbox", "Network Stack"],
      uptime: Math.round(uptime)
    });
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
