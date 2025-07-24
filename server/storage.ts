import { users, type User, type InsertUser } from "@shared/schema";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createPartnership(inviterUserId: string, inviteeUserId: string, inviteeName: string): Promise<void>;
  getPartnership(userId: string): Promise<any | null>;
  removePartnership(userId: string): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private partnerships: Map<string, any>;
  currentId: number;

  constructor() {
    this.users = new Map();
    this.partnerships = new Map();
    this.currentId = 1;
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
