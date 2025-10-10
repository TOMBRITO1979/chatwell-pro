const nodemailer = require('nodemailer');

async function testSMTP() {
  console.log('🔍 Testando conexão SMTP Hostinger...\n');

  const config = {
    host: 'smtp.hostinger.com',
    port: 465,
    secure: true, // SSL
    auth: {
      user: 'contact@chatwell.pro',
      pass: 'j70CEadrB9OKM6Skjn0j3HCldLcfwQvHhLR4!'
    },
    debug: true,
    logger: true
  };

  console.log('📧 Configuração:');
  console.log('Host:', config.host);
  console.log('Port:', config.port);
  console.log('Secure:', config.secure);
  console.log('User:', config.auth.user);
  console.log('Pass:', config.auth.pass.substring(0, 5) + '...\n');

  try {
    const transporter = nodemailer.createTransport(config);

    console.log('⏳ Verificando conexão...');
    await transporter.verify();
    console.log('✅ Conexão estabelecida com sucesso!\n');

    console.log('📤 Enviando email de teste...');
    const info = await transporter.sendMail({
      from: '"Chatwell Pro" <contact@chatwell.pro>',
      to: 'wrbs.alt@gmail.com',
      subject: 'Teste SMTP - Chatwell Pro',
      text: 'Este é um email de teste para verificar a configuração SMTP.',
      html: '<h1>✅ Email de Teste</h1><p>Se você recebeu este email, o SMTP está funcionando corretamente!</p>'
    });

    console.log('✅ Email enviado com sucesso!');
    console.log('Message ID:', info.messageId);
    console.log('Response:', info.response);

  } catch (error) {
    console.error('❌ Erro ao testar SMTP:');
    console.error('Tipo:', error.code || error.name);
    console.error('Mensagem:', error.message);
    console.error('Stack:', error.stack);
  }
}

testSMTP();
