import { sendEmail, emailTemplates } from './email';
import { createWAHAClient } from './waha/client';

// Configurações padrão do WAHA (Tarefa 5)
const DEFAULT_WAHA_CONFIG = {
  apiUrl: 'https://zap.joinerchat.net',
  sessionName: 'chatwell-pro',
  apiKey: 'CoMeCoH2ki86xkbibnczGqeDgYqxE0p65YEWFiM',
  defaultPhone: '380947105869@c.us'
};

/**
 * Envia notificação de confirmação de agendamento
 */
export async function sendEventConfirmation(
  userId: string,
  event: {
    title: string;
    start_time: string;
    end_time: string;
    location?: string;
    phone?: string;
    email?: string;
  }
) {
  const startTime = new Date(event.start_time).toLocaleString('pt-BR');
  const endTime = new Date(event.end_time).toLocaleString('pt-BR');

  // Enviar email se fornecido
  if (event.email) {
    try {
      const template = emailTemplates.eventConfirmation(
        event.title,
        startTime,
        endTime,
        event.location
      );

      await sendEmail(null, {
        to: event.email,
        subject: template.subject,
        html: template.html
      });

      console.log(`✅ Email de confirmação enviado para ${event.email}`);
    } catch (error) {
      console.error('Erro ao enviar email de confirmação:', error);
    }
  }

  // Enviar WhatsApp se fornecido
  if (event.phone) {
    try {
      const wahaClient = createWAHAClient(
        DEFAULT_WAHA_CONFIG.apiUrl,
        DEFAULT_WAHA_CONFIG.sessionName,
        DEFAULT_WAHA_CONFIG.apiKey
      );

      const message = `✅ *Agendamento Confirmado*\n\n` +
        `📋 *Título:* ${event.title}\n` +
        `📅 *Início:* ${startTime}\n` +
        `⏰ *Fim:* ${endTime}\n` +
        (event.location ? `📍 *Local:* ${event.location}\n` : '') +
        `\nAguardamos você! 🤝`;

      await wahaClient.sendText(event.phone, message);
      console.log(`✅ WhatsApp de confirmação enviado para ${event.phone}`);
    } catch (error) {
      console.error('Erro ao enviar WhatsApp de confirmação:', error);
    }
  }
}

/**
 * Envia lembretes diários de agendamentos (Tarefa 4.2)
 * Deve ser executado todos os dias às 18h
 */
export async function sendDailyEventReminders(userPhone: string) {
  try {
    const { db } = await import('./db');

    // Buscar todos os usuários que têm telefone configurado no perfil
    const usersResult = await db.query(
      `SELECT id, name, phone FROM users WHERE phone IS NOT NULL AND phone != ''`
    );

    for (const user of usersResult.rows) {
      // Buscar eventos do dia seguinte
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      const dayAfterTomorrow = new Date(tomorrow);
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

      const eventsResult = await db.query(
        `SELECT id, title, start_time, location
         FROM events
         WHERE user_id = $1
         AND start_time >= $2
         AND start_time < $3
         ORDER BY start_time ASC`,
        [user.id, tomorrow.toISOString(), dayAfterTomorrow.toISOString()]
      );

      if (eventsResult.rows.length === 0) continue;

      const events = eventsResult.rows.map(event => ({
        title: event.title,
        startTime: new Date(event.start_time).toLocaleString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit'
        }),
        location: event.location
      }));

      const dateStr = tomorrow.toLocaleDateString('pt-BR');

      // Enviar WhatsApp
      try {
        const wahaClient = createWAHAClient(
          DEFAULT_WAHA_CONFIG.apiUrl,
          DEFAULT_WAHA_CONFIG.sessionName,
          DEFAULT_WAHA_CONFIG.apiKey
        );

        const message = `📅 *Seus agendamentos para ${dateStr}*\n\n` +
          `Você tem ${events.length} agendamento(s) para amanhã:\n\n` +
          events.map((e, i) =>
            `${i + 1}. *${e.title}* - ${e.startTime}` +
            (e.location ? `\n   📍 ${e.location}` : '')
          ).join('\n\n') +
          `\n\nNão se esqueça! ⏰`;

        await wahaClient.sendText(user.phone, message);
        console.log(`✅ Lembretes enviados para ${user.name} (${user.phone})`);
      } catch (error) {
        console.error(`Erro ao enviar lembretes para ${user.name}:`, error);
      }
    }
  } catch (error) {
    console.error('Erro ao enviar lembretes diários:', error);
  }
}

/**
 * Envia lembretes diários de contas a vencer (Tarefa 4.3)
 * Deve ser executado todos os dias às 20h
 */
export async function sendDailyAccountReminders() {
  try {
    const { db } = await import('./db');

    // Buscar todos os usuários que têm telefone configurado no perfil
    const usersResult = await db.query(
      `SELECT id, name, phone, email FROM users WHERE (phone IS NOT NULL AND phone != '') OR (email IS NOT NULL AND email != '')`
    );

    for (const user of usersResult.rows) {
      // Buscar contas que vencem amanhã
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      const dayAfterTomorrow = new Date(tomorrow);
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

      const accountsResult = await db.query(
        `SELECT title, amount, type, due_date
         FROM accounts
         WHERE user_id = $1
         AND status != 'paid'
         AND due_date >= $2
         AND due_date < $3
         ORDER BY due_date ASC`,
        [user.id, tomorrow.toISOString().split('T')[0], dayAfterTomorrow.toISOString().split('T')[0]]
      );

      if (accountsResult.rows.length === 0) continue;

      const accounts = accountsResult.rows.map(account => ({
        title: account.title,
        amount: parseFloat(account.amount),
        type: account.type
      }));

      const dateStr = tomorrow.toLocaleDateString('pt-BR');

      // Enviar WhatsApp se tiver telefone
      if (user.phone) {
        try {
          const wahaClient = createWAHAClient(
            DEFAULT_WAHA_CONFIG.apiUrl,
            DEFAULT_WAHA_CONFIG.sessionName,
            DEFAULT_WAHA_CONFIG.apiKey
          );

          const message = `💰 *Contas que vencem em ${dateStr}*\n\n` +
            `Você tem ${accounts.length} conta(s) que vencem amanhã:\n\n` +
            accounts.map((a, i) =>
              `${i + 1}. *${a.title}*\n   R$ ${a.amount.toFixed(2)} (${a.type === 'payable' ? 'A Pagar' : 'A Receber'})`
            ).join('\n\n') +
            `\n\nNão se esqueça! 💸`;

          await wahaClient.sendText(user.phone, message);
          console.log(`✅ Lembretes de contas enviados para ${user.name} (WhatsApp)`);
        } catch (error) {
          console.error(`Erro ao enviar WhatsApp para ${user.name}:`, error);
        }
      }

      // Enviar Email se tiver email
      if (user.email) {
        try {
          const template = emailTemplates.dailyAccountsReminder(accounts, dateStr);

          await sendEmail(null, {
            to: user.email,
            subject: template.subject,
            html: template.html
          });

          console.log(`✅ Lembretes de contas enviados para ${user.name} (Email)`);
        } catch (error) {
          console.error(`Erro ao enviar email para ${user.name}:`, error);
        }
      }
    }
  } catch (error) {
    console.error('Erro ao enviar lembretes de contas:', error);
  }
}
