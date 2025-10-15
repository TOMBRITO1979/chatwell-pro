import { Worker } from 'bullmq';
import { createReminderWorker } from './reminder-worker';
import { ReminderJobData } from './reminder-queue';

/**
 * Worker instance global
 */
let reminderWorker: Worker<ReminderJobData> | null = null;

/**
 * Inicia o worker de lembretes
 */
export function startReminderWorker(): void {
  if (reminderWorker) {
    console.log('⚠️  Worker de lembretes já está rodando');
    return;
  }

  try {
    reminderWorker = createReminderWorker();
    console.log('✅ Worker de lembretes iniciado com sucesso');
  } catch (error) {
    console.error('❌ Erro ao iniciar worker de lembretes:', error);
    throw error;
  }
}

/**
 * Para o worker de lembretes
 */
export async function stopReminderWorker(): Promise<void> {
  if (!reminderWorker) {
    console.log('⚠️  Worker de lembretes não está rodando');
    return;
  }

  try {
    await reminderWorker.close();
    reminderWorker = null;
    console.log('✅ Worker de lembretes parado com sucesso');
  } catch (error) {
    console.error('❌ Erro ao parar worker de lembretes:', error);
    throw error;
  }
}

/**
 * Verifica se o worker está rodando
 */
export function isWorkerRunning(): boolean {
  return reminderWorker !== null;
}

// Auto-inicia o worker quando o módulo é importado
// (em ambiente de produção/desenvolvimento)
if (process.env.NODE_ENV !== 'test') {
  startReminderWorker();
}
