import { pgTable, text, serial, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User table for local storage
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  telegramId: text("telegram_id").notNull().unique(),
  name: text("name").notNull(),
  avatar: text("avatar"),
});

// Partner table
export const partners = pgTable("partners", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  partnerTelegramId: text("partner_telegram_id").notNull(),
  partnerName: text("partner_name").notNull(),
  partnerAvatar: text("partner_avatar"),
  connectedAt: text("connected_at").notNull(),
});

// Game sessions table
export const gameSessions = pgTable("game_sessions", {
  id: serial("id").primaryKey(),
  gameType: text("game_type").notNull(),
  userScore: integer("user_score").notNull().default(0),
  partnerScore: integer("partner_score").notNull().default(0),
  startedAt: text("started_at").notNull(),
  finishedAt: text("finished_at"),
  status: text("status").notNull().default("active"), // active, completed, cancelled
});

// Game actions table
export const gameActions = pgTable("game_actions", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull(),
  player: text("player").notNull(), // 'user' or 'partner'
  action: text("action").notNull(),
  data: text("data"), // JSON string for action data
  timestamp: text("timestamp").notNull(),
});

// Achievements table
export const achievements = pgTable("achievements", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  type: text("type").notNull(),
  unlockedAt: text("unlocked_at").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  telegramId: true,
  name: true,
  avatar: true,
});

export const insertPartnerSchema = createInsertSchema(partners).pick({
  userId: true,
  partnerTelegramId: true,
  partnerName: true,
  partnerAvatar: true,
  connectedAt: true,
});

export const insertGameSessionSchema = createInsertSchema(gameSessions).pick({
  gameType: true,
  userScore: true,
  partnerScore: true,
  startedAt: true,
  finishedAt: true,
  status: true,
});

export const insertGameActionSchema = createInsertSchema(gameActions).pick({
  sessionId: true,
  player: true,
  action: true,
  data: true,
  timestamp: true,
});

export const insertAchievementSchema = createInsertSchema(achievements).pick({
  userId: true,
  type: true,
  unlockedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertPartner = z.infer<typeof insertPartnerSchema>;
export type Partner = typeof partners.$inferSelect;
export type InsertGameSession = z.infer<typeof insertGameSessionSchema>;
export type GameSession = typeof gameSessions.$inferSelect;
export type InsertGameAction = z.infer<typeof insertGameActionSchema>;
export type GameAction = typeof gameActions.$inferSelect;
export type InsertAchievement = z.infer<typeof insertAchievementSchema>;
export type Achievement = typeof achievements.$inferSelect;
