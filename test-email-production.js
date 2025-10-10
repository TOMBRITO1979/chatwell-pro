// Teste da função de email simulando produção (sem TypeScript)
const nodemailer = require('nodemailer');

async function getDefaultSMTPSettings() {
  return {
    host: 'smtp.hostinger.com',
    port: 465,
    secure: true,
    username: 'contact@chatwell.pro',
    password: 'j70CEadrB9OKM6Skjn0j3HCldLcfwQvHhLR4!',
    from_email: 'contact@chatwell.pro',
    from_name: 'Chatwell Pro',
    is_active: true,
  };
}

async function createTransporter(userId) {
  let settings = null;

  // Se não houver configurações do usuário, usar SMTP padrão do sistema
  if (!userId) {
    console.log('📧 Usando SMTP padrão do sistema (contact@chatwell.pro)');
    settings = await getDefaultSMTPSettings();
  }

  if (!settings) {
    throw new Error('Configurações SMTP não encontradas.');
  }

  const transportConfig = {
    host: settings.host,
    port: settings.port,
    secure: settings.secure === true,
    auth: {
      user: settings.username,
      pass: settings.password,
    },
  };

  if (settings.port === 587) {
    transportConfig.requireTLS = true;
    transportConfig.secure = false;
  }

  const transporter = nodemailer.createTransport(transportConfig);

  return { transporter, settings };
}

async function sendEmail(userId, options) {
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

    console.log('✅ Email enviado com sucesso:', info.messageId);
    console.log('📧 De:', from);
    console.log('📬 Para:', options.to);
    return true;
  } catch (error) {
    console.error('❌ Erro ao enviar email:', error);
    return false;
  }
}

async function testEmailRecovery() {
  console.log('🧪 TESTE COMPLETO DE RECUPERAÇÃO DE SENHA\n');
  console.log('='  .repeat(60));
  console.log('Simulando o fluxo exato da aplicação em produção');
  console.log('='  .repeat(60) + '\n');

  const testUser = {
    name: 'Usuário Teste',
    email: 'wrbs.alt@gmail.com'
  };

  const resetToken = 'cdee57cbb9ec37fa165678b6ce130084734dcab80a2a76922d0056e328b19795';
  const resetUrl = `https://app.chatwell.pro/auth/reset-password/${resetToken}`;

  console.log('👤 Usuário:', testUser.name);
  console.log('📧 Email:', testUser.email);
  console.log('🔗 Link de reset:', resetUrl);
  console.log('');

  console.log('📤 Enviando email de recuperação...\n');

  const emailSent = await sendEmail(null, {
    to: testUser.email,
    subject: 'Recuperação de Senha - Chatwell Pro',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10b981;">🔐 Recuperação de Senha</h2>
        <p>Olá, ${testUser.name}!</p>
        <p>Você solicitou a recuperação de senha da sua conta no <strong>Chatwell Pro</strong>.</p>
        <p>Clique no botão abaixo para criar uma nova senha:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}"
             style="background: linear-gradient(135deg, #10b981 0%, #3b82f6 100%);
                    color: white;
                    padding: 12px 30px;
                    text-decoration: none;
                    border-radius: 8px;
                    font-weight: bold;
                    display: inline-block;">
            Redefinir Senha
          </a>
        </div>
        <p style="color: #6b7280; font-size: 14px;">
          Ou copie e cole este link no seu navegador:<br>
          <a href="${resetUrl}" style="color: #3b82f6;">${resetUrl}</a>
        </p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="color: #6b7280; font-size: 14px;">
          <strong>⚠️ Importante:</strong><br>
          • Este link expira em 1 hora<br>
          • Se você não solicitou esta recuperação, ignore este email<br>
          • Sua senha atual permanece ativa até que você a altere
        </p>
        <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
          Atenciosamente,<br>
          Equipe Chatwell Pro
        </p>
      </div>
    `
  });

  console.log('\n' + '='.repeat(60));
  if (emailSent) {
    console.log('✅ TESTE CONCLUÍDO COM SUCESSO!');
    console.log('📬 Verifique o email wrbs.alt@gmail.com');
  } else {
    console.log('❌ FALHA NO TESTE');
  }
  console.log('='.repeat(60) + '\n');
}

testEmailRecovery();
