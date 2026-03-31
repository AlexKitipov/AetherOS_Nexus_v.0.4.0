import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
export * from "./models/chat";

// System settings to simulate OS state
export const systemSettings = pgTable("system_settings", {
  id: serial("id").primaryKey(),
  theme: text("theme").notNull().default("cyberpunk"),
  notificationsEnabled: boolean("notifications_enabled").default(true),
  kernelModules: text("kernel_modules").array(), // e.g. ["security", "network", "ai"]
});

export const insertSystemSettingsSchema = createInsertSchema(systemSettings);
export type SystemSettings = typeof systemSettings.$inferSelect;
export type InsertSystemSettings = z.infer<typeof insertSystemSettingsSchema>;
