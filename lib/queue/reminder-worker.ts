import { Worker, Job } from 'bullmq';
import { redisConnection, QueueNames, ReminderJobTypes } from './config';
import { ReminderJobData } from './reminder-queue';
import { sendEmail, emailTemplates } from '../email';
import { createWAHAClient } from '../waha/client';
import { db } from '../db';

/**
 * Envia lembrete por email
 */
async function sendEmailReminder(data: ReminderJobData, hoursBefore: number): Promise<boolean> {
  if (!data.email) {
    console.log(`⚠️  Email não fornecido para evento ${data.eventId}`);
    return false;
  }

  try {
    const startTime = new Date(data.eventStartTime).toLocaleString('pt-BR');
    const endTime = new Date(data.eventEndTime).toLocaleString('pt-BR');

    let subject = `⏰ Lembrete: ${data.eventTitle}`;
    if (hoursBefore === 24) {
      subject = `📅 Lembrete (24h antes): ${data.eventTitle}`;
    }

    let html = `
      <h2>⏰ Lembrete de Agendamento</h2>
      <p>Este é um lembrete sobre seu compromisso agendado:</p>
      <br>
      <p><strong>Título:</strong> ${data.eventTitle}</p>
      <p><strong>Data/Hora Início:</strong> ${startTime}</p>
      <p><strong>Data/Hora Fim:</strong> ${endTime}</p>
      ${data.eventLocation ? `<p><strong>Local:</strong> ${data.eventLocation}</p>` : ''}
    `;

    // Adiciona link de reunião online se existir
    if (data.meetingUrl) {
      html += `
        <br>
        <div style="background-color: #f0f9ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0;">
          <p style="margin: 0 0 10px 0;"><strong>🎥 Reunião Online:</strong></p>
          <a href="${data.meetingUrl}"
             style="display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #10b981 0%, #3b82f6 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: bold;"
             target="_blank">
            Entrar na Reunião Online (Jitsi Meet)
          </a>
          <p style="margin: 10px 0 0 0; font-size: 12px; color: #666;">Link: ${data.meetingUrl}</p>
        </div>
      `;
    }

    html += `
      <br>
      <p>Não se esqueça!</p>
      <p>Atenciosamente,<br>Chatwell Pro</p>
    `;

    await sendEmail(null, {
      to: data.email,
      subject,
      html
    });

    console.log(`✅ Email de lembrete enviado para ${data.email}`);
    return true;
  } catch (error) {
    console.error(`❌ Erro ao enviar email de lembrete:`, error);
    return false;
  }
}

/**
 * Envia lembrete por WhatsApp
 */
async function sendWhatsAppReminder(data: ReminderJobData, hoursBefore: number): Promise<boolean> {
  if (!data.phone) {
    console.log(`⚠️  Telefone não fornecido para evento ${data.eventId}`);
    return false;
  }

  try {
    // Buscar configurações WAHA do usuário
    const configResult = await db.query(
      'SELECT api_url, api_key, session_name, is_active FROM waha_settings WHERE user_id = $1',
      [data.userId]
    );

    if (configResult.rows.length === 0 || !configResult.rows[0].is_active) {
      console.log(`⚠️  WAHA não configurado ou inativo para usuário ${data.userId}`);
      return false;
    }

    const config = configResult.rows[0];
    const wahaClient = createWAHAClient(config.api_url, config.session_name, config.api_key);

    // Verifica status da sessão
    const sessionStatus = await wahaClient.getSessionStatus();
    if (sessionStatus.status !== 'WORKING') {
      console.error(`❌ Sessão WAHA não está ativa: ${sessionStatus.status}`);
      return false;
    }

    const startTime = new Date(data.eventStartTime).toLocaleString('pt-BR');
    const endTime = new Date(data.eventEndTime).toLocaleString('pt-BR');

    let message = `⏰ *Lembrete de Agendamento*\n\n`;
    if (hoursBefore === 24) {
      message = `📅 *Lembrete (24h antes)*\n\n`;
    }

    message += `📋 *Título:* ${data.eventTitle}\n`;
    message += `📅 *Início:* ${startTime}\n`;
    message += `⏰ *Fim:* ${endTime}\n`;

    if (data.eventLocation) {
      message += `📍 *Local:* ${data.eventLocation}\n`;
    }

    if (data.meetingUrl) {
      message += `\n🎥 *Link da Reunião Online:*\n${data.meetingUrl}\n`;
    }

    message += `\nNão se esqueça! 🤝`;

    // Formatar número no formato WhatsApp
    let chatId = data.phone.trim().replace(/\D/g, '');
    chatId = `${chatId}@c.us`;

    await wahaClient.sendText(chatId, message);

    console.log(`✅ WhatsApp de lembrete enviado para ${data.phone}`);
    return true;
  } catch (error) {
    console.error(`❌ Erro ao enviar WhatsApp de lembrete:`, error);
    return false;
  }
}

/**
 * Processa job de lembrete
 */
async function processReminderJob(job: Job<ReminderJobData>): Promise<void> {
  const { data } = job;

  console.log(`\n========================================`);
  console.log(`📬 Processando lembrete de evento`);
  console.log(`========================================`);
  console.log(`Tipo: ${data.reminderType}`);
  console.log(`Evento: ${data.eventTitle} (ID: ${data.eventId})`);
  console.log(`Tentativa: ${job.attemptsMade + 1}/3`);

  const hoursBefore = data.reminderType === ReminderJobTypes.DAILY_REMINDER ? 24 : 0;

  const results = await Promise.allSettled([
    data.email ? sendEmailReminder(data, hoursBefore) : Promise.resolve(false),
    data.phone ? sendWhatsAppReminder(data, hoursBefore) : Promise.resolve(false)
  ]);

  const emailSent = results[0].status === 'fulfilled' && results[0].value;
  const whatsappSent = results[1].status === 'fulfilled' && results[1].value;

  if (!emailSent && !whatsappSent) {
    throw new Error('Falha ao enviar lembrete por email e WhatsApp');
  }

  console.log(`✅ Lembrete processado com sucesso`);
  console.log(`   Email: ${emailSent ? '✓' : '✗'}`);
  console.log(`   WhatsApp: ${whatsappSent ? '✓' : '✗'}`);
  console.log(`========================================\n`);
}

/**
 * Cria e inicia o worker de lembretes
 */
export function createReminderWorker(): Worker<ReminderJobData> {
  const worker = new Worker<ReminderJobData>(
    QueueNames.EVENT_REMINDERS,
    processReminderJob,
    {
      connection: redisConnection,
      concurrency: 5, // Processa até 5 lembretes em paralelo
      limiter: {
        max: 10, // Máximo 10 jobs
        duration: 1000 // Por segundo
      }
    }
  );

  worker.on('completed', (job) => {
    console.log(`✅ Job ${job.id} completado com sucesso`);
  });

  worker.on('failed', (job, error) => {
    console.error(`❌ Job ${job?.id} falhou:`, error.message);
    if (job && job.attemptsMade >= 3) {
      console.error(`⚠️  Job ${job.id} excedeu o número máximo de tentativas (3)`);
    }
  });

  worker.on('error', (error) => {
    console.error(`❌ Erro no worker:`, error);
  });

  console.log(`🚀 Worker de lembretes iniciado (concorrência: 5, rate limit: 10/s)`);

  return worker;
}
