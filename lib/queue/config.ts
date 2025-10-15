import { ConnectionOptions } from 'bullmq';

/**
 * Configuração da conexão Redis para BullMQ
 */
export const redisConnection: ConnectionOptions = {
  host: process.env.REDIS_HOST || 'redis',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: null, // Requerido pelo BullMQ
  enableReadyCheck: false,
  retryStrategy: (times: number) => {
    // Retry exponencial: 1s, 2s, 4s, 8s, max 30s
    const delay = Math.min(times * 1000, 30000);
    console.log(`🔄 Tentando reconectar ao Redis (tentativa ${times}). Aguardando ${delay}ms...`);
    return delay;
  }
};

/**
 * Configurações padrão para jobs de lembretes
 */
export const defaultJobOptions = {
  attempts: 3, // 3 tentativas
  backoff: {
    type: 'exponential' as const,
    delay: 5000 // 5s, 10s, 20s
  },
  removeOnComplete: {
    age: 7 * 24 * 3600, // Remove jobs completos após 7 dias
    count: 1000 // Mantém no máximo 1000 jobs completos
  },
  removeOnFail: {
    age: 30 * 24 * 3600 // Remove jobs falhados após 30 dias
  }
};

/**
 * Nomes das filas
 */
export const QueueNames = {
  EVENT_REMINDERS: 'event-reminders'
} as const;

/**
 * Tipos de jobs de lembrete
 */
export const ReminderJobTypes = {
  DAILY_REMINDER: 'daily-reminder',     // 24h antes
  CUSTOM_REMINDER: 'custom-reminder'    // Baseado em reminder_minutes
} as const;
