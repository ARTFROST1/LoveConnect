import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { telegramBot } from "./telegram-bot";

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  // Реферальная система - генерация реферального кода
  app.post("/api/referral/generate", async (req, res) => {
    try {
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }

      // Проверяем, есть ли уже реферальный код для этого пользователя
      let referralCode = await storage.getReferralCode(userId);
      
      if (!referralCode) {
        // Генерируем новый уникальный код
        const code = `ref_${userId}_${Date.now().toString(36)}`;
        referralCode = await storage.createReferralCode({
          userId,
          referralCode: code,
          createdAt: new Date().toISOString()
        });
      }

      // Создаем правильную Telegram WebApp ссылку
      const referralLink = `https://t.me/duolove_bot/DuoLove?startapp=${referralCode.referralCode}`;
      
      res.json({ 
        referralCode: referralCode.referralCode,
        referralLink,
        success: true 
      });
    } catch (error) {
      console.error("Error generating referral code:", error);
      res.status(500).json({ error: "Failed to generate referral code" });
    }
  });

  // Обработка подключения по реферальному коду
  app.post("/api/referral/connect", async (req, res) => {
    try {
      const { referralCode, userId, userName } = req.body;
      
      if (!referralCode || !userId || !userName) {
        return res.status(400).json({ error: "Missing required parameters" });
      }

      // Находим реферальный код
      const codeData = await storage.getReferralCodeByCode(referralCode);
      if (!codeData) {
        return res.status(404).json({ error: "Invalid referral code" });
      }

      // Проверяем, что пользователь не пытается использовать свой собственный код
      if (codeData.userId === userId) {
        return res.status(400).json({ error: "Cannot use your own referral code" });
      }

      // Проверяем, есть ли уже связь для этого пользователя
      const existingConnection = await storage.getReferralConnection(userId);
      if (existingConnection) {
        return res.status(400).json({ error: "User already has a referral connection" });
      }

      // Создаем реферальную связь
      const connection = await storage.createReferralConnection({
        referrerId: codeData.userId,
        referredId: userId,
        referralCode: referralCode,
        connectedAt: new Date().toISOString(),
        status: 'active'
      });

      // Создаем двустороннее партнерство для обеих сторон
      await storage.createPartnership(codeData.userId, userId, userName);

      // Отправляем уведомление в Telegram
      try {
        await telegramBot.notifyPartnerConnection(codeData.userId, userId, userName);
      } catch (notificationError) {
        console.error('Failed to send Telegram notification:', notificationError);
        // Не прерываем процесс, если уведомление не отправилось
      }

      res.json({ 
        success: true,
        partnership: {
          connectionId: connection.id,
          referrerId: codeData.userId,
          referrerName: `Пользователь ${codeData.userId}`,
          referredId: userId,
          referredName: userName
        }
      });
    } catch (error) {
      console.error("Error connecting with referral code:", error);
      res.status(500).json({ error: "Failed to process referral connection" });
    }
  });

  // Получение статистики реферальной системы
  app.get("/api/referral/stats/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      
      const referralCode = await storage.getReferralCode(userId);
      const connections = await storage.getReferralConnections(userId);
      
      res.json({
        referralCode: referralCode?.referralCode || null,
        totalReferrals: connections.length,
        activeReferrals: connections.filter(c => c.status === 'active').length,
        connections: connections
      });
    } catch (error) {
      console.error("Error getting referral stats:", error);
      res.status(500).json({ error: "Failed to get referral stats" });
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

  // Remove partnership (bilateral disconnection)
  app.post("/api/partner/disconnect", async (req, res) => {
    try {
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }

      // Get current partnership before removing it
      const currentPartnership = await storage.getPartnership(userId);
      if (!currentPartnership) {
        return res.status(404).json({ error: "No partnership found" });
      }

      // Remove partnership for both users (bidirectional removal)
      await storage.removePartnership(userId);
      await storage.removePartnership(currentPartnership.partnerId);

      // Notify both users about the disconnection via Telegram bot
      try {
        await telegramBot.notifyPartnerDisconnection(userId, currentPartnership.partnerId);
      } catch (notifyError) {
        console.warn("Failed to notify users via Telegram bot:", notifyError);
      }
      
      res.json({ 
        success: true,
        message: "Partnership successfully disconnected" 
      });
    } catch (error) {
      console.error("Error disconnecting partnership:", error);
      res.status(500).json({ error: "Failed to disconnect partnership" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
