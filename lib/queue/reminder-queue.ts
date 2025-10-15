import { Queue } from 'bullmq';
import { redisConnection, QueueNames, defaultJobOptions, ReminderJobTypes } from './config';

/**
 * Interface para dados do job de lembrete
 */
export interface ReminderJobData {
  eventId: string;
  userId: string;
  eventTitle: string;
  eventStartTime: string;
  eventEndTime: string;
  eventLocation?: string;
  meetingUrl?: string;
  phone?: string;
  email?: string;
  reminderType: typeof ReminderJobTypes[keyof typeof ReminderJobTypes];
}

/**
 * Fila de lembretes de eventos
 */
class ReminderQueue {
  private queue: Queue<ReminderJobData> | null = null;

  /**
   * Inicializa a fila (lazy initialization)
   */
  private getQueue(): Queue<ReminderJobData> {
    if (!this.queue) {
      this.queue = new Queue<ReminderJobData>(QueueNames.EVENT_REMINDERS, {
        connection: redisConnection,
        defaultJobOptions
      });

      console.log(`✅ Fila ${QueueNames.EVENT_REMINDERS} inicializada`);
    }
    return this.queue;
  }

  /**
   * Agenda lembrete diário (24h antes do evento)
   */
  async scheduleDailyReminder(data: ReminderJobData, eventStartTime: Date): Promise<void> {
    const queue = this.getQueue();

    // Calcula 24h antes do evento
    const reminderTime = new Date(eventStartTime);
    reminderTime.setHours(reminderTime.getHours() - 24);

    // Se já passou das 24h antes, não agenda
    if (reminderTime.getTime() <= Date.now()) {
      console.log(`⚠️  Evento ${data.eventId} começa em menos de 24h. Lembrete diário não agendado.`);
      return;
    }

    const delay = reminderTime.getTime() - Date.now();

    await queue.add(
      ReminderJobTypes.DAILY_REMINDER,
      { ...data, reminderType: ReminderJobTypes.DAILY_REMINDER },
      {
        delay,
        jobId: `daily-${data.eventId}` // ID único para evitar duplicatas
      }
    );

    console.log(`✅ Lembrete diário agendado para ${reminderTime.toLocaleString('pt-BR')}`);
    console.log(`   Evento: ${data.eventTitle} (ID: ${data.eventId})`);
  }

  /**
   * Agenda lembrete customizado (baseado em reminder_minutes)
   */
  async scheduleCustomReminder(
    data: ReminderJobData,
    eventStartTime: Date,
    reminderMinutes: number
  ): Promise<void> {
    const queue = this.getQueue();

    // Calcula o horário do lembrete
    const reminderTime = new Date(eventStartTime);
    reminderTime.setMinutes(reminderTime.getMinutes() - reminderMinutes);

    // Se já passou do horário, não agenda
    if (reminderTime.getTime() <= Date.now()) {
      console.log(`⚠️  Horário do lembrete customizado já passou. Não agendado.`);
      return;
    }

    const delay = reminderTime.getTime() - Date.now();

    await queue.add(
      ReminderJobTypes.CUSTOM_REMINDER,
      { ...data, reminderType: ReminderJobTypes.CUSTOM_REMINDER },
      {
        delay,
        jobId: `custom-${data.eventId}` // ID único para evitar duplicatas
      }
    );

    console.log(`✅ Lembrete customizado agendado para ${reminderTime.toLocaleString('pt-BR')}`);
    console.log(`   ${reminderMinutes} minutos antes do evento: ${data.eventTitle}`);
  }

  /**
   * Remove lembretes de um evento (quando for editado/deletado)
   */
  async removeEventReminders(eventId: string): Promise<void> {
    const queue = this.getQueue();

    try {
      // Remove lembrete diário
      const dailyJob = await queue.getJob(`daily-${eventId}`);
      if (dailyJob) {
        await dailyJob.remove();
        console.log(`🗑️  Lembrete diário removido para evento ${eventId}`);
      }

      // Remove lembrete customizado
      const customJob = await queue.getJob(`custom-${eventId}`);
      if (customJob) {
        await customJob.remove();
        console.log(`🗑️  Lembrete customizado removido para evento ${eventId}`);
      }
    } catch (error) {
      console.error(`❌ Erro ao remover lembretes do evento ${eventId}:`, error);
    }
  }

  /**
   * Fecha a conexão da fila
   */
  async close(): Promise<void> {
    if (this.queue) {
      await this.queue.close();
      this.queue = null;
      console.log(`🔒 Fila ${QueueNames.EVENT_REMINDERS} fechada`);
    }
  }
}

// Exporta instância singleton
export const reminderQueue = new ReminderQueue();
