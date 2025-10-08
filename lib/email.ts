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
 */
export async function createTransporter(userId: string) {
  const settings = await getSMTPSettings(userId);

  if (!settings || !settings.is_active) {
    throw new Error('Configurações SMTP não encontradas ou inativas');
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
 * Envia um email usando as configurações SMTP do usuário
 */
export async function sendEmail(userId: string, options: EmailOptions): Promise<boolean> {
  try {
    const { transporter, settings } = await createTransporter(userId);

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

    console.log('Email enviado:', info.messageId);
    return true;
  } catch (error) {
    console.error('Erro ao enviar email:', error);
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
};
