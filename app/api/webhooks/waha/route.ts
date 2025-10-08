import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { event, session, payload, engine, environment } = body;

    console.log('WAHA Webhook received:', { event, session });

    // Process different webhook events
    switch (event) {
      case 'message':
      case 'message.any':
        await handleIncomingMessage(session, payload);
        break;
      case 'state.change':
        await handleStateChange(session, payload);
        break;
      case 'session.status':
        await handleSessionStatus(session, payload);
        break;
      case 'group.join':
      case 'group.leave':
        await handleGroupEvent(session, payload, event);
        break;
      default:
        console.log('WAHA webhook event received:', event, payload);
    }

    return NextResponse.json({
      success: true,
      message: 'Webhook processed successfully'
    });

  } catch (error: any) {
    console.error('WAHA webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed', message: error.message },
      { status: 500 }
    );
  }
}

async function handleIncomingMessage(session: string, payload: any) {
  console.log('Processing incoming message:', { session, from: payload.from, hasMedia: !!payload.hasMedia });

  try {
    // Aqui você pode:
    // 1. Salvar a mensagem no banco de dados
    // 2. Notificar o usuário
    // 3. Processar comandos automáticos
    // 4. Atualizar registros de clientes

    const messageData = {
      session_name: session,
      message_id: payload.id,
      from: payload.from,
      to: payload.to,
      body: payload.body || '',
      timestamp: payload.timestamp,
      hasMedia: payload.hasMedia || false,
      type: payload.type || 'text'
    };

    console.log('Message data:', messageData);

    // Exemplo: Salvar no banco (você pode criar uma tabela whatsapp_messages)
    // await db.query(
    //   'INSERT INTO whatsapp_messages (session_name, message_id, from_number, to_number, body, timestamp, has_media, type) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
    //   [messageData.session_name, messageData.message_id, messageData.from, messageData.to, messageData.body, new Date(messageData.timestamp * 1000), messageData.hasMedia, messageData.type]
    // );

  } catch (error) {
    console.error('Error handling incoming message:', error);
  }
}

async function handleStateChange(session: string, payload: any) {
  console.log('State change:', { session, state: payload.state });

  try {
    // Atualizar status da sessão no banco
    await db.query(
      'UPDATE waha_settings SET status = $1, last_sync = CURRENT_TIMESTAMP WHERE session_name = $2',
      [payload.state, session]
    );
  } catch (error) {
    console.error('Error handling state change:', error);
  }
}

async function handleSessionStatus(session: string, payload: any) {
  console.log('Session status:', { session, status: payload });

  try {
    // Atualizar status da sessão
    await db.query(
      'UPDATE waha_settings SET status = $1, last_sync = CURRENT_TIMESTAMP WHERE session_name = $2',
      [payload.status || 'unknown', session]
    );
  } catch (error) {
    console.error('Error handling session status:', error);
  }
}

async function handleGroupEvent(session: string, payload: any, event: string) {
  console.log('Group event:', { session, event, payload });
  // Processar eventos de grupo (join/leave)
}