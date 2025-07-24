// @ts-ignore - sql.js types may not be fully available
import initSqlJs from 'sql.js';

class SQLiteDatabase {
  private db: any = null;
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      const SQL = await initSqlJs({
        locateFile: (file: string) => `https://sql.js.org/dist/${file}`
      });

      // Try to load existing database from localStorage
      const savedData = localStorage.getItem('duolove_db');
      if (savedData) {
        const binaryArray = new Uint8Array(JSON.parse(savedData));
        this.db = new SQL.Database(binaryArray);
      } else {
        this.db = new SQL.Database();
        await this.createTables();
      }

      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize SQLite database:', error);
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const createTablesSQL = `
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        telegram_id TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        avatar TEXT
      );

      CREATE TABLE IF NOT EXISTS partners (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        partner_telegram_id TEXT NOT NULL,
        partner_name TEXT NOT NULL,
        partner_avatar TEXT,
        connected_at TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        inviter_user_id TEXT
      );

      CREATE TABLE IF NOT EXISTS game_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        game_type TEXT NOT NULL,
        user_score INTEGER DEFAULT 0,
        partner_score INTEGER DEFAULT 0,
        started_at TEXT NOT NULL,
        finished_at TEXT,
        status TEXT DEFAULT 'active'
      );

      CREATE TABLE IF NOT EXISTS game_actions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id INTEGER NOT NULL,
        player TEXT NOT NULL,
        action TEXT NOT NULL,
        data TEXT,
        timestamp TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS achievements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        type TEXT NOT NULL,
        unlocked_at TEXT NOT NULL
      );
    `;

    this.db.exec(createTablesSQL);
    this.saveDatabase();
  }

  private saveDatabase(): void {
    if (!this.db) return;
    
    const data = this.db.export();
    const dataArray = Array.from(data);
    localStorage.setItem('duolove_db', JSON.stringify(dataArray));
  }

  async getUser(telegramId: string): Promise<any> {
    if (!this.db) await this.initialize();
    
    const stmt = this.db!.prepare('SELECT * FROM users WHERE telegram_id = ?');
    const result = stmt.getAsObject([telegramId]);
    stmt.free();
    
    return Object.keys(result).length > 0 ? result : null;
  }

  async createUser(telegramId: string, name: string, avatar?: string | null): Promise<any> {
    if (!this.db) await this.initialize();
    
    console.log('Creating user:', { telegramId, name, avatar });
    
    // Ensure all values are properly defined for SQLite
    const cleanTelegramId = String(telegramId || '');
    const cleanName = String(name || 'User');
    const cleanAvatar = (avatar === undefined || avatar === '' || avatar === null) ? null : String(avatar);
    
    // Check if user already exists
    const existingUser = await this.getUser(cleanTelegramId);
    if (existingUser) {
      console.log('User already exists, returning existing user');
      return existingUser;
    }
    
    const stmt = this.db!.prepare('INSERT INTO users (telegram_id, name, avatar) VALUES (?, ?, ?)');
    try {
      stmt.run([cleanTelegramId, cleanName, cleanAvatar]);
    } catch (error) {
      console.error('Database insert error:', error);
      console.error('Values:', [cleanTelegramId, cleanName, cleanAvatar]);
      throw error;
    } finally {
      stmt.free();
    }
    
    this.saveDatabase();
    return this.getUser(cleanTelegramId);
  }

  async getPartner(userId: number): Promise<any> {
    if (!this.db) await this.initialize();
    
    const stmt = this.db!.prepare('SELECT * FROM partners WHERE user_id = ?');
    const result = stmt.getAsObject([userId]);
    stmt.free();
    
    // Check if result has meaningful data (not just empty object)
    const hasData = result && Object.keys(result).length > 0 && result.id;
    return hasData ? result : null;
  }

  async addPartner(userId: number, partnerTelegramId: string, partnerName: string, partnerAvatar?: string | null, status: string = 'pending', inviterUserId?: string): Promise<any> {
    if (!this.db) await this.initialize();
    
    const connectedAt = new Date().toISOString();
    const stmt = this.db!.prepare('INSERT INTO partners (user_id, partner_telegram_id, partner_name, partner_avatar, connected_at, status, inviter_user_id) VALUES (?, ?, ?, ?, ?, ?, ?)');
    stmt.run([userId, partnerTelegramId, partnerName, partnerAvatar || null, connectedAt, status, inviterUserId || null]);
    stmt.free();
    
    this.saveDatabase();
    return this.getPartner(userId);
  }

  async createGameSession(gameType: string): Promise<any> {
    if (!this.db) await this.initialize();
    
    const startedAt = new Date().toISOString();
    const stmt = this.db!.prepare('INSERT INTO game_sessions (game_type, started_at) VALUES (?, ?)');
    stmt.run([gameType, startedAt]);
    const sessionId = this.db!.exec('SELECT last_insert_rowid()')[0].values[0][0];
    stmt.free();
    
    this.saveDatabase();
    return { id: sessionId, gameType, startedAt, status: 'active' };
  }

  async updateGameSession(sessionId: number, userScore: number, partnerScore: number): Promise<void> {
    if (!this.db) await this.initialize();
    
    const finishedAt = new Date().toISOString();
    const stmt = this.db!.prepare('UPDATE game_sessions SET user_score = ?, partner_score = ?, finished_at = ?, status = "completed" WHERE id = ?');
    stmt.run([userScore, partnerScore, finishedAt, sessionId]);
    stmt.free();
    
    this.saveDatabase();
  }

  async addGameAction(sessionId: number, player: string, action: string, data?: any): Promise<void> {
    if (!this.db) await this.initialize();
    
    const timestamp = new Date().toISOString();
    const stmt = this.db!.prepare('INSERT INTO game_actions (session_id, player, action, data, timestamp) VALUES (?, ?, ?, ?, ?)');
    stmt.run([sessionId, player, action, data ? JSON.stringify(data) : null, timestamp]);
    stmt.free();
    
    this.saveDatabase();
  }

  async getGameHistory(limit: number = 10): Promise<any[]> {
    if (!this.db) await this.initialize();
    
    const stmt = this.db!.prepare('SELECT * FROM game_sessions WHERE status = "completed" ORDER BY finished_at DESC LIMIT ?');
    const results = [];
    
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    
    stmt.free();
    return results;
  }

  async getGameStats(): Promise<any> {
    if (!this.db) await this.initialize();
    
    const totalGamesStmt = this.db!.prepare('SELECT COUNT(*) as total FROM game_sessions WHERE status = "completed"');
    const totalGames = totalGamesStmt.getAsObject()['total'] as number;
    totalGamesStmt.free();
    
    const achievementsStmt = this.db!.prepare('SELECT COUNT(*) as total FROM achievements');
    const achievements = achievementsStmt.getAsObject()['total'] as number;
    achievementsStmt.free();
    
    return {
      gamesPlayed: totalGames,
      achievements,
      hearts: totalGames * 10, // Simple calculation
      winRate: 65, // Would calculate based on actual wins
      currentStreak: 7 // Would calculate based on consecutive days
    };
  }

  async updatePartnerStatus(userId: number, status: string): Promise<void> {
    if (!this.db) await this.initialize();
    
    const stmt = this.db!.prepare('UPDATE partners SET status = ? WHERE user_id = ?');
    stmt.run([status, userId]);
    stmt.free();
    
    this.saveDatabase();
  }

  async getPartnerByTelegramId(telegramId: string): Promise<any> {
    if (!this.db) await this.initialize();
    
    const stmt = this.db!.prepare('SELECT * FROM partners WHERE partner_telegram_id = ?');
    const result = stmt.getAsObject([telegramId]);
    stmt.free();
    
    return Object.keys(result).length > 0 ? result : null;
  }

  async updatePartnerInfo(userId: number, partnerName: string, partnerAvatar?: string | null): Promise<void> {
    if (!this.db) await this.initialize();
    
    const stmt = this.db!.prepare('UPDATE partners SET partner_name = ?, partner_avatar = ? WHERE user_id = ?');
    stmt.run([partnerName, partnerAvatar || null, userId]);
    stmt.free();
    
    this.saveDatabase();
  }

  async addAchievement(userId: number, type: string): Promise<void> {
    if (!this.db) await this.initialize();
    
    const unlockedAt = new Date().toISOString();
    const stmt = this.db!.prepare('INSERT INTO achievements (user_id, type, unlocked_at) VALUES (?, ?, ?)');
    stmt.run([userId, type, unlockedAt]);
    stmt.free();
    
    this.saveDatabase();
  }

  async getAllGameSessions(): Promise<any[]> {
    if (!this.db) await this.initialize();
    
    const stmt = this.db!.prepare('SELECT * FROM game_sessions ORDER BY started_at DESC');
    const results = [];
    
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    
    stmt.free();
    return results;
  }

  async getUserAchievements(userId: number): Promise<any[]> {
    if (!this.db) await this.initialize();
    
    const stmt = this.db!.prepare('SELECT * FROM achievements WHERE user_id = ?');
    const results = [];
    
    try {
      stmt.bind([userId]);
      while (stmt.step()) {
        results.push(stmt.getAsObject());
      }
    } catch (error) {
      console.error('Error fetching user achievements:', error);
    } finally {
      stmt.free();
    }
    
    return results;
  }

  async removePartner(userId: number): Promise<void> {
    if (!this.db) await this.initialize();
    
    const stmt = this.db!.prepare('DELETE FROM partners WHERE user_id = ?');
    stmt.run([userId]);
    stmt.free();
    
    this.saveDatabase();
  }
}

export const database = new SQLiteDatabase();
