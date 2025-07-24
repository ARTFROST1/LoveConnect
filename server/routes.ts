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

  // Notify partner connection and create bidirectional relationship
  app.post("/api/partner/notify", async (req, res) => {
    try {
      const { inviterUserId, inviteeUserId, inviteeName } = req.body;
      
      if (!inviterUserId || !inviteeUserId || !inviteeName) {
        return res.status(400).json({ error: "Missing required parameters" });
      }

      // Send Telegram notification to inviter
      await telegramBot.notifyPartnerConnection(inviterUserId, inviteeUserId, inviteeName);
      
      // Store bidirectional partnership in server storage for sync
      await storage.createPartnership(inviterUserId, inviteeUserId, inviteeName);
      
      res.json({ 
        success: true,
        message: "Partner notification sent and partnership created" 
      });
    } catch (error) {
      console.error("Error notifying partner:", error);
      res.status(500).json({ error: "Failed to notify partner" });
    }
  });

  // Get partnership status for polling
  app.get("/api/partner/status/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      
      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }

      const partnership = await storage.getPartnership(userId);
      
      res.json({ 
        partnership,
        hasPartner: !!partnership 
      });
    } catch (error) {
      console.error("Error getting partner status:", error);
      res.status(500).json({ error: "Failed to get partner status" });
    }
  });

  // Unlink partner (bilateral disconnection)
  app.post("/api/unlink-partner", async (req, res) => {
    try {
      const { user_id, partner_id } = req.body;
      
      if (!user_id || !partner_id) {
        return res.status(400).json({ error: "Both user_id and partner_id are required" });
      }

      // Notify both users about the disconnection via Telegram bot
      try {
        await telegramBot.notifyPartnerDisconnection(user_id, partner_id);
      } catch (notifyError) {
        console.warn("Failed to notify users via Telegram bot:", notifyError);
      }
      
      res.json({ 
        success: true,
        message: "Partner disconnection processed" 
      });
    } catch (error) {
      console.error("Error unlinking partner:", error);
      res.status(500).json({ error: "Failed to unlink partner" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
