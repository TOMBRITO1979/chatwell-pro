import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import crypto from 'crypto';
import { sendEmail, emailTemplates } from '@/lib/email';

// POST /api/auth/reset-password - Solicitar reset de senha
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, message: 'Email é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se o usuário existe
    const userResult = await db.query(
      'SELECT id, name, email FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (userResult.rows.length === 0) {
      // Por segurança, não informar se o email existe ou não
      return NextResponse.json({
        success: true,
        message: 'Se o email existir em nossa base, você receberá um link de recuperação.'
      });
    }

    const user = userResult.rows[0];

    // Gerar token de reset
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hora

    // Salvar token no banco
    await db.query(
      `UPDATE users
       SET reset_token = $1, reset_token_expiry = $2
       WHERE id = $3`,
      [resetTokenHash, resetTokenExpiry, user.id]
    );

    // Criar link de reset
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://app.chatwell.pro'}/auth/reset-password/${resetToken}`;

    // Tentar enviar email usando SMTP configurado
    try {
      // Buscar configurações SMTP do usuário
      const smtpResult = await db.query(
        'SELECT host, port, secure, username, password, from_email, from_name FROM smtp_settings WHERE user_id = $1 AND is_active = true',
        [user.id]
      );

      if (smtpResult.rows.length === 0) {
        // SMTP não configurado - retornar link diretamente
        console.log('SMTP não configurado para usuário:', user.email);

        return NextResponse.json({
          success: true,
          message: '⚠️ SMTP não configurado. Copie o link abaixo para recuperar sua senha:',
          resetUrl: resetUrl,
          instructions: 'Configure o SMTP em Configurações para receber emails automaticamente.',
          devMode: true
        });
      }

      // SMTP configurado - enviar email
      const smtpConfig = smtpResult.rows[0];
      const nodemailer = require('nodemailer');

      const transportConfig: any = {
        host: smtpConfig.host,
        port: smtpConfig.port,
        secure: smtpConfig.secure === true,
        auth: {
          user: smtpConfig.username,
          pass: smtpConfig.password,
        },
      };

      if (smtpConfig.port === 587) {
        transportConfig.requireTLS = true;
        transportConfig.secure = false;
      }

      const transporter = nodemailer.createTransport(transportConfig);

      const from = smtpConfig.from_name
        ? `"${smtpConfig.from_name}" <${smtpConfig.from_email}>`
        : smtpConfig.from_email;

      await transporter.sendMail({
        from,
        to: user.email,
        subject: 'Recuperação de Senha - Chatwell Pro',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #10b981;">🔐 Recuperação de Senha</h2>
            <p>Olá, ${user.name}!</p>
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

      return NextResponse.json({
        success: true,
        message: '✅ Email de recuperação enviado com sucesso! Verifique sua caixa de entrada.'
      });

    } catch (emailError: any) {
      console.error('Erro ao enviar email:', emailError);

      // Em caso de erro no email, retornar o link (modo fallback)
      return NextResponse.json({
        success: true,
        message: '⚠️ Não foi possível enviar o email. Use o link abaixo:',
        resetUrl: resetUrl,
        error: emailError.message,
        devMode: true
      });
    }

  } catch (error: any) {
    console.error('Erro no reset de senha:', error);
    return NextResponse.json(
      { success: false, message: 'Erro ao processar solicitação' },
      { status: 500 }
    );
  }
}

// GET /api/auth/reset-password?token=xxx - Verificar token
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Token não fornecido' },
        { status: 400 }
      );
    }

    // Hash do token para comparar
    const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Verificar se token existe e não expirou
    const result = await db.query(
      `SELECT id, email FROM users
       WHERE reset_token = $1
       AND reset_token_expiry > NOW()`,
      [resetTokenHash]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'Token inválido ou expirado'
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Token válido',
      email: result.rows[0].email
    });

  } catch (error: any) {
    console.error('Erro ao verificar token:', error);
    return NextResponse.json(
      { success: false, message: 'Erro ao verificar token' },
      { status: 500 }
    );
  }
}

// PUT /api/auth/reset-password - Confirmar nova senha
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, password } = body;

    if (!token || !password) {
      return NextResponse.json(
        { success: false, message: 'Token e senha são obrigatórios' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, message: 'A senha deve ter no mínimo 6 caracteres' },
        { status: 400 }
      );
    }

    // Hash do token
    const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Verificar token
    const userResult = await db.query(
      `SELECT id FROM users
       WHERE reset_token = $1
       AND reset_token_expiry > NOW()`,
      [resetTokenHash]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'Token inválido ou expirado'
      }, { status: 400 });
    }

    const userId = userResult.rows[0].id;

    // Hash da nova senha
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 10);

    // Atualizar senha e limpar token
    await db.query(
      `UPDATE users
       SET password = $1, reset_token = NULL, reset_token_expiry = NULL
       WHERE id = $2`,
      [hashedPassword, userId]
    );

    return NextResponse.json({
      success: true,
      message: 'Senha alterada com sucesso! Faça login com sua nova senha.'
    });

  } catch (error: any) {
    console.error('Erro ao redefinir senha:', error);
    return NextResponse.json(
      { success: false, message: 'Erro ao redefinir senha' },
      { status: 500 }
    );
  }
}
