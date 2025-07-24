import { 
  users, 
  referralCodes, 
  referralConnections,
  type User, 
  type InsertUser,
  type ReferralCode,
  type InsertReferralCode,
  type ReferralConnection,
  type InsertReferralConnection
} from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Реферальная система
  createReferralCode(data: InsertReferralCode): Promise<ReferralCode>;
  getReferralCode(userId: string): Promise<ReferralCode | null>;
  getReferralCodeByCode(code: string): Promise<ReferralCode | null>;
  createReferralConnection(data: InsertReferralConnection): Promise<ReferralConnection>;
  getReferralConnection(referredId: string): Promise<ReferralConnection | null>;
  getReferralConnections(referrerId: string): Promise<ReferralConnection[]>;
  
  // Партнерства (обновленные методы)
  createPartnership(inviterUserId: string, inviteeUserId: string, inviteeName: string): Promise<void>;
  getPartnership(userId: string): Promise<any | null>;
  removePartnership(userId: string): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private partnerships: Map<string, any>;
  private referralCodes: Map<string, ReferralCode>; // userId -> ReferralCode
  private referralConnections: Map<string, ReferralConnection>; // referredId -> ReferralConnection
  private referralsByReferrer: Map<string, ReferralConnection[]>; // referrerId -> ReferralConnection[]
  currentId: number;
  currentReferralId: number;
  currentConnectionId: number;

  constructor() {
    this.users = new Map();
    this.partnerships = new Map();
    this.referralCodes = new Map();
    this.referralConnections = new Map();
    this.referralsByReferrer = new Map();
    this.currentId = 1;
    this.currentReferralId = 1;
    this.currentConnectionId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.telegramId === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { 
      ...insertUser, 
      id,
      avatar: insertUser.avatar || null
    };
    this.users.set(id, user);
    return user;
  }

  // Реферальная система
  async createReferralCode(data: InsertReferralCode): Promise<ReferralCode> {
    const id = this.currentReferralId++;
    const referralCode: ReferralCode = {
      id,
      ...data
    };
    this.referralCodes.set(data.userId, referralCode);
    return referralCode;
  }

  async getReferralCode(userId: string): Promise<ReferralCode | null> {
    return this.referralCodes.get(userId) || null;
  }

  async getReferralCodeByCode(code: string): Promise<ReferralCode | null> {
    for (const referralCode of this.referralCodes.values()) {
      if (referralCode.referralCode === code) {
        return referralCode;
      }
    }
    return null;
  }

  async createReferralConnection(data: InsertReferralConnection): Promise<ReferralConnection> {
    const id = this.currentConnectionId++;
    const connection: ReferralConnection = {
      id,
      ...data
    };
    
    // Сохраняем связь
    this.referralConnections.set(data.referredId, connection);
    
    // Добавляем в список реферралов для реферера
    const existingReferrals = this.referralsByReferrer.get(data.referrerId) || [];
    existingReferrals.push(connection);
    this.referralsByReferrer.set(data.referrerId, existingReferrals);
    
    return connection;
  }

  async getReferralConnection(referredId: string): Promise<ReferralConnection | null> {
    return this.referralConnections.get(referredId) || null;
  }

  async getReferralConnections(referrerId: string): Promise<ReferralConnection[]> {
    return this.referralsByReferrer.get(referrerId) || [];
  }

  async createPartnership(inviterUserId: string, inviteeUserId: string, inviteeName: string): Promise<void> {
    const partnership = {
      inviterUserId,
      inviteeUserId,
      inviteeName,
      createdAt: new Date().toISOString()
    };
    
    // Create bidirectional partnership
    this.partnerships.set(inviterUserId, { ...partnership, partnerId: inviteeUserId, partnerName: inviteeName });
    this.partnerships.set(inviteeUserId, { ...partnership, partnerId: inviterUserId, partnerName: `User ${inviterUserId}` });
  }

  async getPartnership(userId: string): Promise<any | null> {
    return this.partnerships.get(userId) || null;
  }

  async removePartnership(userId: string): Promise<void> {
    const partnership = this.partnerships.get(userId);
    if (partnership) {
      // Remove both sides of the partnership
      this.partnerships.delete(userId);
      this.partnerships.delete(partnership.partnerId);
    }
  }
}

export const storage = new MemStorage();
