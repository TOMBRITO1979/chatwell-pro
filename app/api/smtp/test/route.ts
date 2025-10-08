import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, extractTokenFromHeader } from '@/lib/auth';
import { testSMTPConnection, sendEmail } from '@/lib/email';

// POST /api/smtp/test - Testar conexão SMTP
export async function POST(request: NextRequest) {
  try {
    const token = extractTokenFromHeader(request.headers.get('authorization'));
    if (!token) {
      return NextResponse.json({ message: 'Token não fornecido' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ message: 'Token inválido' }, { status: 401 });
    }

    const body = await request.json();
    const { host, port, secure, username, password, from_email, from_name, send_test_email, test_email } = body;

    // Validação
    if (!host || !port || !username || !password || !from_email) {
      return NextResponse.json({
        message: 'Todos os campos são obrigatórios para o teste'
      }, { status: 400 });
    }

    // Testar conexão
    const testResult = await testSMTPConnection({
      host,
      port: parseInt(port),
      secure: secure || true,
      username,
      password,
      from_email,
      from_name,
      is_active: true
    });

    if (!testResult.success) {
      return NextResponse.json({
        success: false,
        message: testResult.message
      }, { status: 400 });
    }

    // Se solicitado, enviar email de teste
    if (send_test_email && test_email) {
      try {
        // Enviar email de teste usando as configurações fornecidas
        const nodemailer = require('nodemailer');

        // Configuração correta do transporte
        const transportConfig: any = {
          host,
          port: parseInt(port),
          secure: secure === true, // true para 465 (SSL), false para 587 (STARTTLS)
          auth: {
            user: username,
            pass: password,
          },
        };

        // Para porta 587, usar STARTTLS
        if (parseInt(port) === 587) {
          transportConfig.requireTLS = true;
          transportConfig.secure = false;
        }

        const transporter = nodemailer.createTransport(transportConfig);

        const from = from_name
          ? `"${from_name}" <${from_email}>`
          : from_email;

        await transporter.sendMail({
          from,
          to: test_email,
          subject: 'Teste de Configuração SMTP - Chatwell Pro',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #10b981;">✅ Teste de Conexão SMTP</h2>
              <p>Parabéns! Sua configuração SMTP está funcionando corretamente.</p>
              <p>Este email foi enviado automaticamente pelo <strong>Chatwell Pro</strong> para confirmar que o servidor SMTP está configurado e operacional.</p>
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
              <p style="color: #6b7280; font-size: 14px;">
                <strong>Detalhes da configuração testada:</strong><br>
                Host: ${host}<br>
                Porta: ${port}<br>
                Seguro: ${secure ? 'Sim (SSL/TLS)' : 'Não'}<br>
                Email de origem: ${from_email}
              </p>
            </div>
          `
        });

        return NextResponse.json({
          success: true,
          message: 'Conexão SMTP estabelecida com sucesso! Email de teste enviado.',
          test_email_sent: true
        });
      } catch (emailError: any) {
        console.error('Erro ao enviar email de teste:', emailError);
        return NextResponse.json({
          success: true,
          message: 'Conexão SMTP estabelecida, mas houve erro ao enviar email de teste: ' + emailError.message,
          test_email_sent: false
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: testResult.message
    });

  } catch (error: any) {
    console.error('Erro ao testar SMTP:', error);
    return NextResponse.json({
      success: false,
      message: error.message || 'Erro ao testar conexão SMTP'
    }, { status: 500 });
  }
}
