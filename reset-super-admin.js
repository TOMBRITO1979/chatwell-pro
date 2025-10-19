const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { Client } = require('pg');

/**
 * Script para resetar Super Admin e enviar email de recuperação
 *
 * Uso:
 *   node reset-super-admin.js
 *
 * O script irá:
 * 1. Criar/atualizar super admin com email especificado
 * 2. Gerar token de recuperação de senha
 * 3. Exibir link de redefinição de senha
 */

async function resetSuperAdmin() {
  // Configuração
  const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://chatwell:RuGc2mfJ8oJW6giog3RiJCBd5qZmWp@localhost:5432/chatwell';
  const SUPER_ADMIN_EMAIL = 'wasolutionscorp@gmail.com';
  const SUPER_ADMIN_USERNAME = 'wasolutionscorp';
  const SUPER_ADMIN_NAME = 'WA Solutions Corp';
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://app.chatwell.pro';

  const client = new Client({ connectionString: DATABASE_URL });

  try {
    await client.connect();
    console.log('\n🔄 Conectando ao banco de dados...');

    // Verificar se tabela existe
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'super_admins'
      );
    `);

    if (!tableCheck.rows[0].exists) {
      console.log('❌ Tabela super_admins não existe!');
      console.log('Execute primeiro: npm run super-admin:setup');
      process.exit(1);
    }

    // Gerar token de reset
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    const resetExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

    // Senha temporária aleatória (não será usada, pois resetará via email)
    const tempPassword = crypto.randomBytes(20).toString('hex');
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    // Verificar se super admin existe
    const existingAdmin = await client.query(
      'SELECT id FROM super_admins WHERE email = $1 OR username = $2',
      [SUPER_ADMIN_EMAIL, SUPER_ADMIN_USERNAME]
    );

    if (existingAdmin.rows.length > 0) {
      // Atualizar super admin existente
      await client.query(`
        UPDATE super_admins
        SET username = $1,
            email = $2,
            name = $3,
            password_hash = $4,
            password_reset_token = $5,
            password_reset_expires = $6,
            is_active = true,
            updated_at = NOW()
        WHERE id = $7
      `, [
        SUPER_ADMIN_USERNAME,
        SUPER_ADMIN_EMAIL,
        SUPER_ADMIN_NAME,
        passwordHash,
        resetTokenHash,
        resetExpires,
        existingAdmin.rows[0].id
      ]);

      console.log('✅ Super Admin atualizado com sucesso!');
    } else {
      // Criar novo super admin
      await client.query(`
        INSERT INTO super_admins (
          username, email, name, password_hash,
          password_reset_token, password_reset_expires, is_active
        )
        VALUES ($1, $2, $3, $4, $5, $6, true)
      `, [
        SUPER_ADMIN_USERNAME,
        SUPER_ADMIN_EMAIL,
        SUPER_ADMIN_NAME,
        passwordHash,
        resetTokenHash,
        resetExpires
      ]);

      console.log('✅ Super Admin criado com sucesso!');
    }

    // Gerar link de redefinição
    const resetLink = `${APP_URL}/super-admin/reset-password?token=${resetToken}`;

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('✅ SUPER ADMIN RESETADO COM SUCESSO!');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`\n📧 Email: ${SUPER_ADMIN_EMAIL}`);
    console.log(`👤 Username: ${SUPER_ADMIN_USERNAME}`);
    console.log('\n🔐 Link de redefinição de senha (válido por 24h):');
    console.log(`\n${resetLink}`);
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('\n⚠️  IMPORTANTE:');
    console.log('1. Acesse o link acima para definir uma nova senha');
    console.log('2. O link expira em 24 horas');
    console.log('3. Após definir a senha, você poderá fazer login normalmente');
    console.log('\n═══════════════════════════════════════════════════════════\n');

    // Se houver configuração de email, enviar email (opcional)
    const EMAIL_HOST = process.env.EMAIL_HOST || process.env.DEFAULT_SMTP_HOST;
    const EMAIL_USER = process.env.EMAIL_USER || process.env.DEFAULT_SMTP_USER;

    if (EMAIL_HOST && EMAIL_USER) {
      console.log('📨 Tentando enviar email de recuperação...\n');

      try {
        const nodemailer = require('nodemailer');

        const transporter = nodemailer.createTransport({
          host: EMAIL_HOST,
          port: parseInt(process.env.EMAIL_PORT || process.env.DEFAULT_SMTP_PORT || '587'),
          secure: process.env.EMAIL_SECURE === 'true' || process.env.DEFAULT_SMTP_SECURE === 'true',
          auth: {
            user: EMAIL_USER,
            pass: process.env.EMAIL_PASS || process.env.DEFAULT_SMTP_PASS
          }
        });

        await transporter.sendMail({
          from: `"${process.env.EMAIL_FROM_NAME || 'Chatwell Pro'}" <${EMAIL_USER}>`,
          to: SUPER_ADMIN_EMAIL,
          subject: 'Redefinição de Senha - Super Admin Chatwell Pro',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #10bb82;">Redefinição de Senha - Super Admin</h2>

              <p>Olá <strong>${SUPER_ADMIN_NAME}</strong>,</p>

              <p>Você solicitou a redefinição da senha do Super Admin do Chatwell Pro.</p>

              <p>Clique no botão abaixo para definir uma nova senha:</p>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetLink}"
                   style="background-color: #10bb82; color: white; padding: 12px 30px;
                          text-decoration: none; border-radius: 5px; display: inline-block;">
                  Redefinir Senha
                </a>
              </div>

              <p>Ou copie e cole este link no seu navegador:</p>
              <p style="background-color: #f5f5f5; padding: 10px; border-radius: 3px;
                        word-break: break-all; font-size: 12px;">
                ${resetLink}
              </p>

              <p><strong>⚠️ Este link expira em 24 horas.</strong></p>

              <p>Se você não solicitou esta redefinição, ignore este email.</p>

              <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

              <p style="color: #666; font-size: 12px;">
                Chatwell Pro - Sistema de Gestão Empresarial<br>
                Este é um email automático, não responda.
              </p>
            </div>
          `
        });

        console.log('✅ Email de recuperação enviado com sucesso!\n');
        console.log(`📧 Verifique a caixa de entrada de: ${SUPER_ADMIN_EMAIL}\n`);

      } catch (emailError) {
        console.log('⚠️  Não foi possível enviar o email automaticamente.');
        console.log('💡 Use o link acima manualmente.\n');
        console.log(`Erro: ${emailError.message}\n`);
      }
    } else {
      console.log('ℹ️  Configuração de email não encontrada.');
      console.log('💡 Use o link acima para redefinir a senha.\n');
    }

  } catch (error) {
    console.error('\n❌ Erro ao resetar super admin:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Executar
resetSuperAdmin()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
