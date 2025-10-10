// Teste da função sendEmail com as configurações reais
require('dotenv').config();

async function testEmailFunction() {
  console.log('🧪 Testando função sendEmail()...\n');

  // Carregar a função de email
  const { sendEmail } = require('./lib/email.ts');

  console.log('📧 Variáveis de ambiente carregadas:');
  console.log('DEFAULT_SMTP_HOST:', process.env.DEFAULT_SMTP_HOST);
  console.log('DEFAULT_SMTP_PORT:', process.env.DEFAULT_SMTP_PORT);
  console.log('DEFAULT_SMTP_USER:', process.env.DEFAULT_SMTP_USER);
  console.log('DEFAULT_SMTP_PASS:', process.env.DEFAULT_SMTP_PASS ? process.env.DEFAULT_SMTP_PASS.substring(0, 5) + '...' : 'NÃO DEFINIDA');
  console.log('DEFAULT_FROM_EMAIL:', process.env.DEFAULT_FROM_EMAIL);
  console.log('DEFAULT_FROM_NAME:', process.env.DEFAULT_FROM_NAME);
  console.log('');

  try {
    console.log('📤 Enviando email de teste usando sendEmail(null, {...})...\n');

    const result = await sendEmail(null, {
      to: 'wrbs.alt@gmail.com',
      subject: '🔐 Teste de Recuperação de Senha - Chatwell Pro',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #10b981;">🔐 Teste de Recuperação de Senha</h2>
          <p>Olá!</p>
          <p>Este é um email de teste para verificar se o sistema de recuperação de senha está funcionando.</p>
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
            Este é apenas um teste. Se você recebeu este email, o sistema está funcionando corretamente!
          </p>
          <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
            Atenciosamente,<br>
            Equipe Chatwell Pro
          </p>
        </div>
      `
    });

    if (result) {
      console.log('\n✅ ✅ ✅ SUCESSO! Email enviado com sucesso!');
      console.log('Verifique o email wrbs.alt@gmail.com\n');
    } else {
      console.log('\n❌ Falha ao enviar email');
    }

  } catch (error) {
    console.error('\n❌ Erro ao testar função de email:');
    console.error(error);
  }
}

testEmailFunction();
