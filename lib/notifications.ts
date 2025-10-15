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
    meeting_url?: string;
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
        event.location,
        event.meeting_url
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
      console.log(`\n========================================`);
      console.log(`📱 INICIANDO ENVIO DE WHATSAPP`);
      console.log(`========================================`);
      console.log(`📞 Telefone recebido: "${event.phone}"`);
      console.log(`📋 Título do evento: "${event.title}"`);
      console.log(`👤 User ID: ${userId}`);

      // Buscar configurações WAHA do banco de dados
      const { db } = await import('./db');
      const configResult = await db.query(
        'SELECT api_url, api_key, session_name, is_active FROM waha_settings WHERE user_id = $1',
        [userId]
      );

      if (configResult.rows.length === 0) {
        console.error(`❌ Configurações WAHA não encontradas para o usuário ${userId}`);
        console.error(`💡 Acesse /configuracoes e configure a integração WhatsApp (WAHA) antes de enviar mensagens`);
        console.log(`========================================\n`);
        return;
      }

      const config = configResult.rows[0];

      if (!config.is_active) {
        console.error(`❌ Integração WAHA está DESATIVADA para o usuário ${userId}`);
        console.error(`💡 Acesse /configuracoes e ative a integração WhatsApp (WAHA)`);
        console.log(`========================================\n`);
        return;
      }

      console.log(`⚙️  WAHA Config do banco:`);
      console.log(`   - URL: ${config.api_url}`);
      console.log(`   - Session: ${config.session_name}`);
      console.log(`   - API Key: ${config.api_key ? '***configurada***' : 'não configurada'}`);
      console.log(`   - Ativo: ${config.is_active ? 'SIM' : 'NÃO'}`);

      const wahaClient = createWAHAClient(
        config.api_url,
        config.session_name,
        config.api_key
      );

      // Verifica status da sessão antes de enviar
      let sessionStatus;
      try {
        console.log(`\n🔍 Verificando status da sessão...`);
        sessionStatus = await wahaClient.getSessionStatus();
        console.log(`📱 Status da sessão: ${sessionStatus.status}`);
        console.log(`📋 Dados da sessão:`, JSON.stringify(sessionStatus, null, 2));

        if (sessionStatus.status !== 'WORKING') {
          console.error(`\n❌ ERRO: Sessão WAHA não está ativa!`);
          console.error(`   Status atual: ${sessionStatus.status}`);
          console.error(`   Status esperado: WORKING`);
          console.error(`💡 Acesse /configuracoes para reconectar o WhatsApp`);
          console.log(`========================================\n`);
          return;
        }
        console.log(`✅ Sessão está ativa e pronta para enviar mensagens`);
      } catch (statusError: any) {
        console.error(`\n❌ ERRO ao verificar status da sessão WAHA!`);
        console.error(`   Mensagem: ${statusError.message}`);
        console.error(`   Stack:`, statusError.stack);
        console.error(`💡 Verifique se o serviço WAHA está rodando e acessível em ${DEFAULT_WAHA_CONFIG.apiUrl}`);
        console.log(`========================================\n`);
        return;
      }

      const message = `✅ *Agendamento Confirmado*\n\n` +
        `📋 *Título:* ${event.title}\n` +
        `📅 *Início:* ${startTime}\n` +
        `⏰ *Fim:* ${endTime}\n` +
        (event.location ? `📍 *Local:* ${event.location}\n` : '') +
        (event.meeting_url ? `\n🎥 *Link da Reunião Online:*\n${event.meeting_url}\n` : '') +
        `\nAguardamos você! 🤝`;

      // Formatar número no formato WhatsApp (adicionar @c.us se não tiver)
      let chatId = event.phone.trim();

      // Remove caracteres não numéricos exceto @
      if (!chatId.includes('@')) {
        chatId = chatId.replace(/\D/g, '');
        chatId = `${chatId}@c.us`;
      }

      console.log(`\n📝 Preparando envio:`);
      console.log(`   Número original: "${event.phone}"`);
      console.log(`   Chat ID formatado: "${chatId}"`);
      console.log(`   Tamanho da mensagem: ${message.length} caracteres`);
      console.log(`   Preview da mensagem:\n${message.substring(0, 100)}...`);

      console.log(`\n📤 Enviando mensagem para WAHA...`);
      const sendResult = await wahaClient.sendText(chatId, message);
      console.log(`✅ Resposta do WAHA:`, JSON.stringify(sendResult, null, 2));
      console.log(`✅ WhatsApp de confirmação enviado com sucesso para ${event.phone}`);
      console.log(`========================================\n`);
    } catch (error: any) {
      console.error(`\n❌❌❌ ERRO AO ENVIAR WHATSAPP ❌❌❌`);
      console.error(`   Mensagem: ${error.message || error}`);
      console.error(`   Stack:`, error.stack);
      if (error.response) {
        console.error(`   HTTP Status: ${error.response.status}`);
        console.error(`   Response Data:`, JSON.stringify(error.response.data, null, 2));
        console.error(`   Response Headers:`, JSON.stringify(error.response.headers, null, 2));
      }
      if (error.config) {
        console.error(`   Request URL: ${error.config.url}`);
        console.error(`   Request Method: ${error.config.method}`);
        console.error(`   Request Data:`, JSON.stringify(error.config.data, null, 2));
      }
      console.log(`========================================\n`);
    }
  }
}

/**
 * Envia follow-up de confirmação para agendamentos do dia seguinte
 * Deve ser executado todos os dias às 8h
 * Intervalo de 50 segundos entre cada mensagem
 */
export async function sendDailyEventFollowUp() {
  try {
    const { db } = await import('./db');

    console.log('\n========================================');
    console.log('📅 INICIANDO FOLLOW-UP DIÁRIO DE AGENDAMENTOS');
    console.log('========================================');
    console.log(`⏰ Horário: ${new Date().toLocaleString('pt-BR')}`);

    // Buscar todos os usuários
    const usersResult = await db.query('SELECT id, name FROM users');

    for (const user of usersResult.rows) {
      console.log(`\n👤 Processando usuário: ${user.name} (ID: ${user.id})`);

      // Buscar eventos do dia seguinte
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      const dayAfterTomorrow = new Date(tomorrow);
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

      // Buscar configurações WAHA do usuário
      const wahaConfigResult = await db.query(
        'SELECT api_url, api_key, session_name, is_active FROM waha_settings WHERE user_id = $1',
        [user.id]
      );

      const hasWaha = wahaConfigResult.rows.length > 0 && wahaConfigResult.rows[0].is_active;

      if (!hasWaha) {
        console.log(`  ⚠️  WAHA não configurado ou inativo - pulando envio de WhatsApp`);
      }

      // Buscar eventos do dia seguinte com telefone ou email
      const eventsResult = await db.query(
        `SELECT id, title, start_time, end_time, location, phone, email
         FROM events
         WHERE user_id = $1
         AND start_time >= $2
         AND start_time < $3
         AND (phone IS NOT NULL OR email IS NOT NULL)
         ORDER BY start_time ASC`,
        [user.id, tomorrow.toISOString(), dayAfterTomorrow.toISOString()]
      );

      if (eventsResult.rows.length === 0) {
        console.log(`  ℹ️  Nenhum evento com contato para amanhã`);
        continue;
      }

      console.log(`  📋 Encontrados ${eventsResult.rows.length} evento(s) para follow-up`);

      // Processar cada evento com intervalo de 50 segundos
      for (let i = 0; i < eventsResult.rows.length; i++) {
        const event = eventsResult.rows[i];
        const eventTime = new Date(event.start_time).toLocaleString('pt-BR');

        console.log(`\n  📌 Evento ${i + 1}/${eventsResult.rows.length}: "${event.title}"`);
        console.log(`     Horário: ${eventTime}`);
        console.log(`     Contatos: ${event.phone ? '📱 WhatsApp' : ''} ${event.email ? '📧 Email' : ''}`);

        const message = `🔔 *Confirmação de Agendamento*\n\n` +
          `Olá! Este é um lembrete para confirmar seu agendamento de *amanhã*:\n\n` +
          `📋 *${event.title}*\n` +
          `📅 *Data/Hora:* ${eventTime}\n` +
          `${event.location ? `📍 *Local:* ${event.location}\n` : ''}` +
          `\nPor favor, confirme sua presença respondendo esta mensagem.\n\n` +
          `Aguardamos você! 🤝`;

        // Enviar WhatsApp se tiver telefone e WAHA configurado
        if (event.phone && hasWaha) {
          try {
            const wahaConfig = wahaConfigResult.rows[0];
            const wahaClient = createWAHAClient(
              wahaConfig.api_url,
              wahaConfig.session_name,
              wahaConfig.api_key
            );

            // Verificar status da sessão
            const sessionStatus = await wahaClient.getSessionStatus();

            if (sessionStatus.status === 'WORKING') {
              let chatId = event.phone.trim();
              if (!chatId.includes('@')) {
                chatId = chatId.replace(/\D/g, '');
                chatId = `${chatId}@c.us`;
              }

              await wahaClient.sendText(chatId, message);
              console.log(`     ✅ WhatsApp enviado para ${event.phone}`);
            } else {
              console.log(`     ⚠️  Sessão WAHA não está ativa: ${sessionStatus.status}`);
            }
          } catch (error: any) {
            console.error(`     ❌ Erro ao enviar WhatsApp: ${error.message}`);
          }
        }

        // Enviar Email se tiver
        if (event.email) {
          try {
            const template = emailTemplates.eventConfirmation(
              event.title,
              eventTime,
              eventTime,
              event.location
            );

            await sendEmail(null, {
              to: event.email,
              subject: '🔔 Confirmação de Agendamento para Amanhã',
              html: template.html
            });

            console.log(`     ✅ Email enviado para ${event.email}`);
          } catch (error: any) {
            console.error(`     ❌ Erro ao enviar email: ${error.message}`);
          }
        }

        // Aguardar 50 segundos antes do próximo (exceto no último)
        if (i < eventsResult.rows.length - 1) {
          console.log(`     ⏳ Aguardando 50 segundos antes do próximo...`);
          await new Promise(resolve => setTimeout(resolve, 50000));
        }
      }
    }

    console.log('\n========================================');
    console.log('✅ FOLLOW-UP DIÁRIO CONCLUÍDO');
    console.log('========================================\n');

  } catch (error) {
    console.error('❌ Erro ao enviar follow-up diário:', error);
    throw error;
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
