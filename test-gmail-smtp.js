const nodemailer = require('nodemailer');

async function testGmailSMTP() {
  console.log('🔍 Testando SMTP do Gmail...\n');

  const config = {
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // STARTTLS
    auth: {
      user: 'wasolutionscorp@gmail.com',
      pass: 'yxknnhhbjpebkxja'
    },
    tls: {
      rejectUnauthorized: true
    }
  };

  console.log('📧 Configuração:');
  console.log('Host:', config.host);
  console.log('Port:', config.port);
  console.log('Secure:', config.secure, '(STARTTLS)');
  console.log('User:', config.auth.user);
  console.log('Pass:', config.auth.pass.substring(0, 5) + '...\n');

  try {
    const transporter = nodemailer.createTransport(config);

    console.log('⏳ Verificando conexão...');
    await transporter.verify();
    console.log('✅ Conexão estabelecida com sucesso!\n');

    console.log('📤 Enviando email de teste...');
    const info = await transporter.sendMail({
      from: '"Chatwell Pro" <wasolutionscorp@gmail.com>',
      to: 'wrbs.alt@gmail.com',
      subject: 'Teste SMTP Gmail - Chatwell Pro',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #10b981;">🔐 Teste de Recuperação de Senha</h2>
          <p>Olá!</p>
          <p>Este email foi enviado usando <strong>Gmail SMTP</strong> para testar o sistema de recuperação de senha do Chatwell Pro.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://app.chatwell.pro/auth/reset-password/TEST123"
               style="background: linear-gradient(135deg, #10b981 0%, #3b82f6 100%);
                      color: white;
                      padding: 12px 30px;
                      text-decoration: none;
                      border-radius: 8px;
                      font-weight: bold;
                      display: inline-block;">
              Redefinir Senha (TESTE)
            </a>
          </div>
          <p style="color: #6b7280; font-size: 14px;">
            Se você recebeu este email, o Gmail SMTP está configurado corretamente!
          </p>
          <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
            Atenciosamente,<br>
            Equipe Chatwell Pro
          </p>
        </div>
      `
    });

    console.log('✅ Email enviado com sucesso!');
    console.log('Message ID:', info.messageId);
    console.log('Response:', info.response);
    console.log('\n🎉 TESTE CONCLUÍDO COM SUCESSO!');
    console.log('📬 Verifique o email wrbs.alt@gmail.com\n');

  } catch (error) {
    console.error('❌ Erro ao testar SMTP:');
    console.error('Tipo:', error.code || error.name);
    console.error('Mensagem:', error.message);
  }
}

testGmailSMTP();
