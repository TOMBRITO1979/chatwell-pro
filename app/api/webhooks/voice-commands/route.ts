import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { parseVoiceCommand } from '@/lib/voice-parser';

/**
 * POST /api/webhooks/voice-commands
 *
 * Endpoint para receber comandos de voz do n8n (Telegram/WhatsApp)
 *
 * Autenticação: API Key no header X-API-Key
 *
 * Body:
 * {
 *   "transcription": "texto do áudio convertido",
 *   "type": "auto" | "event" | "account",  // auto = detecta automaticamente
 *   "source": "telegram" | "whatsapp",
 *   "metadata": {
 *     "audio_url": "url do áudio original (opcional)",
 *     "timestamp": "2025-10-18T10:30:00Z",
 *     "chat_id": "id do chat",
 *     "message_id": "id da mensagem"
 *   }
 * }
 *
 * Retorna:
 * {
 *   "success": true,
 *   "type": "event" | "account",
 *   "data": {...},  // evento ou conta criado
 *   "message": "mensagem de confirmação para enviar ao usuário"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Autenticação via API Key
    const apiKey = request.headers.get('x-api-key');

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          message: 'API Key não fornecida. Inclua o header X-API-Key.'
        },
        { status: 401 }
      );
    }

    // Buscar usuário pela API Key
    const userResult = await db.query(
      `SELECT id, name, email FROM users WHERE api_key = $1 AND is_active = true`,
      [apiKey]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'API Key inválida ou usuário inativo.'
        },
        { status: 401 }
      );
    }

    const user = userResult.rows[0];

    // 2. Validar payload
    const body = await request.json();
    const { transcription, type = 'auto', source, metadata } = body;

    if (!transcription || transcription.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Transcrição do áudio é obrigatória.'
        },
        { status: 400 }
      );
    }

    // 3. Parser inteligente do comando de voz
    const parsedCommand = await parseVoiceCommand(transcription, type);

    if (!parsedCommand.success) {
      return NextResponse.json(
        {
          success: false,
          message: parsedCommand.error || 'Não consegui entender o comando. Tente novamente.',
          transcription,
          suggestion: 'Tente falar algo como: "Agendar reunião com cliente amanhã às 15 horas" ou "Conta de energia vence dia 25 no valor de 350 reais"'
        },
        { status: 400 }
      );
    }

    // 4. Criar evento ou conta baseado no tipo detectado
    let createdData;
    let confirmationMessage;

    if (parsedCommand.type === 'event') {
      // Criar evento/compromisso
      const eventData = parsedCommand.data;

      const eventResult = await db.query(
        `INSERT INTO events (
          user_id, title, description, start_time, end_time,
          location, event_type, color, is_all_day, reminder_minutes
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id, title, start_time, end_time, location, event_type, created_at`,
        [
          user.id,
          eventData.title,
          eventData.description || `Criado via ${source || 'voz'}: ${transcription}`,
          eventData.start_time,
          eventData.end_time,
          eventData.location || null,
          eventData.event_type || 'meeting',
          eventData.color || '#3B82F6',
          eventData.is_all_day || false,
          eventData.reminder_minutes || 30
        ]
      );

      createdData = eventResult.rows[0];

      const startDate = new Date(createdData.start_time);
      const formattedDate = startDate.toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        hour: '2-digit',
        minute: '2-digit'
      });

      confirmationMessage = `✅ Evento agendado com sucesso!\n\n` +
        `📅 ${createdData.title}\n` +
        `🕒 ${formattedDate}\n` +
        (createdData.location ? `📍 ${createdData.location}\n` : '') +
        `\nID: ${createdData.id}`;

    } else if (parsedCommand.type === 'account') {
      // Criar conta a pagar/receber
      const accountData = parsedCommand.data;

      const accountResult = await db.query(
        `INSERT INTO accounts (
          user_id, title, description, amount, due_date,
          type, status, category, payment_method
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id, title, amount, due_date, type, status, category, created_at`,
        [
          user.id,
          accountData.title,
          accountData.description || `Criado via ${source || 'voz'}: ${transcription}`,
          accountData.amount,
          accountData.due_date,
          accountData.type || 'expense',
          accountData.status || 'pending',
          accountData.category || null,
          accountData.payment_method || null
        ]
      );

      createdData = accountResult.rows[0];

      const dueDate = new Date(createdData.due_date);
      const formattedDate = dueDate.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });

      const typeEmoji = createdData.type === 'receivable' ? '💰' : '💸';
      const typeName = createdData.type === 'receivable' ? 'Conta a receber' : 'Conta a pagar';

      confirmationMessage = `✅ ${typeName} cadastrada com sucesso!\n\n` +
        `${typeEmoji} ${createdData.title}\n` +
        `💵 R$ ${parseFloat(createdData.amount).toFixed(2)}\n` +
        `📅 Vencimento: ${formattedDate}\n` +
        (createdData.category ? `🏷️ Categoria: ${createdData.category}\n` : '') +
        `\nID: ${createdData.id}`;
    }

    // 5. Log da ação (opcional - para auditoria)
    try {
      await db.query(
        `INSERT INTO voice_command_logs (
          user_id, transcription, parsed_type, source, metadata, created_item_id, created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [
          user.id,
          transcription,
          parsedCommand.type,
          source || 'unknown',
          JSON.stringify(metadata || {}),
          createdData?.id || null
        ]
      ).catch(err => {
        // Ignora erro se tabela de log não existir (opcional)
        console.warn('Log table does not exist:', err.message);
      });
    } catch (logError) {
      // Ignora erros de log
      console.warn('Failed to log voice command:', logError);
    }

    // 6. Retornar sucesso
    return NextResponse.json({
      success: true,
      type: parsedCommand.type,
      data: createdData,
      message: confirmationMessage,
      parsed_info: parsedCommand.extracted_info
    }, { status: 201 });

  } catch (error: any) {
    console.error('Erro ao processar comando de voz:', error);

    return NextResponse.json({
      success: false,
      message: 'Erro ao processar comando. Tente novamente.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

/**
 * GET /api/webhooks/voice-commands
 *
 * Endpoint de teste/verificação
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    service: 'Chatwell Pro - Voice Commands API',
    version: '1.0.0',
    endpoint: '/api/webhooks/voice-commands',
    method: 'POST',
    authentication: 'X-API-Key header',
    documentation: 'https://docs.chatwell.pro/voice-commands'
  });
}
