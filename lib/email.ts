import nodemailer from 'nodemailer';
import { db } from './db';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
}

export interface SMTPSettings {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
  from_email: string;
  from_name?: string;
  is_active: boolean;
}

/**
 * Configurações SMTP padrão do sistema (variáveis de ambiente)
 * Suporta tanto DEFAULT_SMTP_* quanto EMAIL_* (backward compatibility)
 */
export function getDefaultSMTPSettings(): SMTPSettings | null {
  const host = process.env.DEFAULT_SMTP_HOST || process.env.EMAIL_HOST;
  const port = process.env.DEFAULT_SMTP_PORT || process.env.EMAIL_PORT;
  const user = process.env.DEFAULT_SMTP_USER || process.env.EMAIL_USER;
  const pass = process.env.DEFAULT_SMTP_PASS || process.env.EMAIL_PASS;
  const fromEmail = process.env.DEFAULT_FROM_EMAIL || process.env.EMAIL_USER;

  if (!host || !port || !user || !pass || !fromEmail) {
    console.warn('⚠️  Configurações SMTP padrão não encontradas nas variáveis de ambiente');
    console.warn('Configure DEFAULT_SMTP_* ou EMAIL_* no arquivo .env');
    return null;
  }

  return {
    host,
    port: parseInt(port),
    secure: process.env.DEFAULT_SMTP_SECURE === 'true',
    username: user,
    password: pass,
    from_email: fromEmail,
    from_name: process.env.DEFAULT_FROM_NAME || 'Chatwell Pro',
    is_active: true,
  };
}

/**
 * Busca as configurações SMTP do usuário
 */
export async function getSMTPSettings(userId: string): Promise<SMTPSettings | null> {
  try {
    const result = await db.query(
      'SELECT host, port, secure, username, password, from_email, from_name, is_active FROM smtp_settings WHERE user_id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0] as SMTPSettings;
  } catch (error) {
    console.error('Erro ao buscar configurações SMTP:', error);
    return null;
  }
}

/**
 * Cria um transporter do nodemailer com as configurações SMTP
 * Prioriza configuração do usuário, mas usa SMTP padrão do sistema como fallback
 */
export async function createTransporter(userId?: string) {
  let settings: SMTPSettings | null = null;

  // Tentar obter configurações do usuário primeiro (se userId fornecido)
  if (userId) {
    try {
      settings = await getSMTPSettings(userId);
    } catch (error) {
      console.log('Erro ao buscar SMTP do usuário, usando padrão');
    }
  }

  // Se não houver configurações do usuário, usar SMTP padrão do sistema
  if (!settings || !settings.is_active) {
    console.log('📧 Usando SMTP padrão do sistema (contact@chatwell.pro)');
    settings = getDefaultSMTPSettings();
  }

  if (!settings) {
    throw new Error('Configurações SMTP não encontradas. Configure SMTP padrão nas variáveis de ambiente.');
  }

  // Configuração correta do transporte
  const transportConfig: any = {
    host: settings.host,
    port: settings.port,
    secure: settings.secure === true, // true para 465 (SSL), false para 587 (STARTTLS)
    auth: {
      user: settings.username,
      pass: settings.password,
    },
  };

  // Para porta 587, forçar STARTTLS
  if (settings.port === 587) {
    transportConfig.requireTLS = true;
    transportConfig.secure = false;
  }

  const transporter = nodemailer.createTransport(transportConfig);

  return { transporter, settings };
}

/**
 * Envia um email usando as configurações SMTP do usuário ou padrão do sistema
 * @param userId - ID do usuário (opcional). Se não fornecido, usa SMTP padrão do sistema
 * @param options - Opções do email (to, subject, text, html)
 */
export async function sendEmail(userId: string | null | undefined, options: EmailOptions): Promise<boolean> {
  try {
    const { transporter, settings } = await createTransporter(userId || undefined);

    const from = settings.from_name
      ? `"${settings.from_name}" <${settings.from_email}>`
      : settings.from_email;

    const info = await transporter.sendMail({
      from,
      to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });

    console.log('✅ Email enviado com sucesso:', info.messageId);
    console.log('📧 De:', from);
    console.log('📬 Para:', options.to);
    return true;
  } catch (error) {
    console.error('❌ Erro ao enviar email:', error);
    return false;
  }
}

/**
 * Testa a conexão SMTP
 */
export async function testSMTPConnection(settings: SMTPSettings): Promise<{ success: boolean; message: string }> {
  try {
    // Configuração correta do transporte
    const transportConfig: any = {
      host: settings.host,
      port: settings.port,
      secure: settings.secure === true, // true para 465 (SSL), false para 587 (STARTTLS)
      auth: {
        user: settings.username,
        pass: settings.password,
      },
    };

    // Para porta 587, forçar STARTTLS
    if (settings.port === 587) {
      transportConfig.requireTLS = true;
      transportConfig.secure = false;
    }

    const transporter = nodemailer.createTransport(transportConfig);

    await transporter.verify();
    return { success: true, message: 'Conexão SMTP estabelecida com sucesso!' };
  } catch (error: any) {
    console.error('Erro ao testar conexão SMTP:', error);
    return {
      success: false,
      message: error.message || 'Erro ao conectar ao servidor SMTP'
    };
  }
}

/**
 * Templates de email pré-definidos
 */
export const emailTemplates = {
  welcome: (name: string) => ({
    subject: 'Bem-vindo ao Chatwell Pro',
    html: `
      <h1>Olá, ${name}!</h1>
      <p>Bem-vindo ao <strong>Chatwell Pro</strong>, seu sistema completo de gestão empresarial.</p>
      <p>Estamos felizes em tê-lo conosco!</p>
      <br>
      <p>Atenciosamente,<br>Equipe Chatwell Pro</p>
    `
  }),

  taskReminder: (taskTitle: string, dueDate: string) => ({
    subject: `Lembrete: ${taskTitle}`,
    html: `
      <h2>Lembrete de Tarefa</h2>
      <p>A tarefa <strong>${taskTitle}</strong> vence em ${dueDate}.</p>
      <p>Não se esqueça de concluí-la!</p>
      <br>
      <p>Atenciosamente,<br>Chatwell Pro</p>
    `
  }),

  eventReminder: (eventTitle: string, startTime: string) => ({
    subject: `Lembrete: ${eventTitle}`,
    html: `
      <h2>Lembrete de Evento</h2>
      <p>Você tem um evento agendado: <strong>${eventTitle}</strong></p>
      <p>Data/Hora: ${startTime}</p>
      <br>
      <p>Atenciosamente,<br>Chatwell Pro</p>
    `
  }),

  accountReminder: (accountTitle: string, amount: number, dueDate: string, type: string) => ({
    subject: `Lembrete: ${type === 'payable' ? 'Conta a Pagar' : 'Conta a Receber'}`,
    html: `
      <h2>Lembrete de ${type === 'payable' ? 'Conta a Pagar' : 'Conta a Receber'}</h2>
      <p><strong>${accountTitle}</strong></p>
      <p>Valor: R$ ${amount.toFixed(2)}</p>
      <p>Vencimento: ${dueDate}</p>
      <br>
      <p>Atenciosamente,<br>Chatwell Pro</p>
    `
  }),

  eventConfirmation: (eventTitle: string, startTime: string, endTime: string, location?: string, meetingUrl?: string) => ({
    subject: `Confirmação de Agendamento: ${eventTitle}`,
    html: `
      <h2>✅ Agendamento Confirmado</h2>
      <p>Seu agendamento foi confirmado com sucesso!</p>
      <br>
      <p><strong>Título:</strong> ${eventTitle}</p>
      <p><strong>Data/Hora Início:</strong> ${startTime}</p>
      <p><strong>Data/Hora Fim:</strong> ${endTime}</p>
      ${location ? `<p><strong>Local:</strong> ${location}</p>` : ''}
      ${meetingUrl ? `
        <br>
        <div style="background-color: #f0f9ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0;">
          <p style="margin: 0 0 10px 0;"><strong>🎥 Reunião Online:</strong></p>
          <a href="${meetingUrl}"
             style="display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #10b981 0%, #3b82f6 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: bold;"
             target="_blank">
            Entrar na Reunião Online (Jitsi Meet)
          </a>
          <p style="margin: 10px 0 0 0; font-size: 12px; color: #666;">Link: ${meetingUrl}</p>
        </div>
      ` : ''}
      <br>
      <p>Aguardamos você!</p>
      <p>Atenciosamente,<br>Chatwell Pro</p>
    `
  }),

  dailyEventsReminder: (events: Array<{title: string, startTime: string, location?: string}>, date: string) => ({
    subject: `📅 Seus agendamentos para ${date}`,
    html: `
      <h2>📅 Agendamentos para ${date}</h2>
      <p>Você tem ${events.length} agendamento(s) para amanhã:</p>
      <ul>
        ${events.map(event => `
          <li>
            <strong>${event.title}</strong> - ${event.startTime}
            ${event.location ? `<br>Local: ${event.location}` : ''}
          </li>
        `).join('')}
      </ul>
      <br>
      <p>Não se esqueça!</p>
      <p>Atenciosamente,<br>Chatwell Pro</p>
    `
  }),

  dailyAccountsReminder: (accounts: Array<{title: string, amount: number, type: string}>, date: string) => ({
    subject: `💰 Contas que vencem em ${date}`,
    html: `
      <h2>💰 Contas que vencem em ${date}</h2>
      <p>Você tem ${accounts.length} conta(s) que vencem amanhã:</p>
      <ul>
        ${accounts.map(account => `
          <li>
            <strong>${account.title}</strong> - R$ ${account.amount.toFixed(2)}
            <br><small>(${account.type === 'payable' ? 'A Pagar' : 'A Receber'})</small>
          </li>
        `).join('')}
      </ul>
      <br>
      <p>Não se esqueça!</p>
      <p>Atenciosamente,<br>Chatwell Pro</p>
    `
  }),
};
