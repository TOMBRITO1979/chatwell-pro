import { Pool, PoolClient } from 'pg';

// Singleton para conexão com PostgreSQL
class Database {
  private static instance: Database;
  private pool: Pool;

  private constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 20, // Máximo de conexões no pool
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Log de erros de conexão
    this.pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
    });
  }

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  // Executa uma query
  public async query(text: string, params?: any[]) {
    const start = Date.now();
    try {
      const res = await this.pool.query(text, params);
      const duration = Date.now() - start;
      console.log('Executed query', { text, duration, rows: res.rowCount });
      return res;
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  }

  // Obtém um client do pool para transações
  public async getClient(): Promise<PoolClient> {
    return await this.pool.connect();
  }

  // Fecha todas as conexões
  public async close() {
    await this.pool.end();
  }
}

// Exporta instância singleton
export const db = Database.getInstance();

// Helper para inicializar o banco de dados
export async function initializeDatabase() {
  try {
    // Testa a conexão
    await db.query('SELECT NOW()');
    console.log('✅ Database connected successfully');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

// Helper para executar o schema
export async function runMigrations() {
  const fs = require('fs');
  const path = require('path');
  
  try {
    const schemaPath = path.join(process.cwd(), 'database', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    await db.query(schema);
    console.log('✅ Database schema created successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to create schema:', error);
    return false;
  }
}
