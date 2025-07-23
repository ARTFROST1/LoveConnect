import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { telegramBot } from "./telegram-bot";

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  // Generate invite link
  app.post("/api/invite/generate", async (req, res) => {
    try {
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }

      const inviteLink = await telegramBot.generateInviteLink(userId);
      
      res.json({ 
        inviteLink,
        success: true 
      });
    } catch (error) {
      console.error("Error generating invite link:", error);
      res.status(500).json({ error: "Failed to generate invite link" });
    }
  });

  // Get bot info
  app.get("/api/bot/info", async (_req, res) => {
    try {
      const botInfo = await telegramBot.getBotInfo();
      res.json({ 
        botInfo,
        isActive: !!botInfo 
      });
    } catch (error) {
      console.error("Error getting bot info:", error);
      res.status(500).json({ error: "Failed to get bot info" });
    }
  });

  // Notify partner connection
  app.post("/api/partner/notify", async (req, res) => {
    try {
      const { inviterUserId, inviteeUserId, inviteeName } = req.body;
      
      if (!inviterUserId || !inviteeUserId || !inviteeName) {
        return res.status(400).json({ error: "Missing required parameters" });
      }

      await telegramBot.notifyPartnerConnection(inviterUserId, inviteeUserId, inviteeName);
      
      res.json({ 
        success: true,
        message: "Partner notification sent" 
      });
    } catch (error) {
      console.error("Error notifying partner:", error);
      res.status(500).json({ error: "Failed to notify partner" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
