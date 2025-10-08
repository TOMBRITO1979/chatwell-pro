import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken, extractTokenFromHeader } from '@/lib/auth';
import { createWAHAClient } from '@/lib/waha/client';

// GET /api/waha/session - Obter status da sessão
export async function GET(request: NextRequest) {
  try {
    const token = extractTokenFromHeader(request.headers.get('authorization'));
    if (!token) {
      return NextResponse.json({ message: 'Token não fornecido' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ message: 'Token inválido' }, { status: 401 });
    }

    // Buscar configurações
    const configResult = await db.query(
      'SELECT api_url, api_key, session_name, status FROM waha_settings WHERE user_id = $1',
      [payload.userId]
    );

    if (configResult.rows.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'Configuração WAHA não encontrada'
      }, { status: 404 });
    }

    const config = configResult.rows[0];
    const client = createWAHAClient(config.api_url, config.session_name, config.api_key);

    try {
      const sessionStatus = await client.getSessionStatus();

      // Atualizar status no banco
      await db.query(
        'UPDATE waha_settings SET status = $1, last_sync = CURRENT_TIMESTAMP WHERE user_id = $2',
        [sessionStatus.status, payload.userId]
      );

      return NextResponse.json({
        success: true,
        session: sessionStatus
      });
    } catch (error: any) {
      // Sessão não existe
      return NextResponse.json({
        success: true,
        session: {
          name: config.session_name,
          status: 'stopped',
        }
      });
    }

  } catch (error: any) {
    console.error('Erro ao obter status da sessão:', error);
    return NextResponse.json({
      success: false,
      message: error.message || 'Erro ao obter status'
    }, { status: 500 });
  }
}

// POST /api/waha/session - Iniciar sessão
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

    const { action } = await request.json();

    // Buscar configurações
    const configResult = await db.query(
      'SELECT api_url, api_key, session_name, webhook_url FROM waha_settings WHERE user_id = $1',
      [payload.userId]
    );

    if (configResult.rows.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'Configuração WAHA não encontrada'
      }, { status: 404 });
    }

    const config = configResult.rows[0];
    const client = createWAHAClient(config.api_url, config.session_name, config.api_key);

    if (action === 'start') {
      // Iniciar sessão
      const sessionConfig: any = {};

      // Se tiver webhook configurado, adicionar
      if (config.webhook_url) {
        sessionConfig.webhooks = [{
          url: config.webhook_url,
          events: ['message', 'message.any', 'state.change'],
        }];
      }

      const session = await client.startSession(sessionConfig);

      // Atualizar status
      await db.query(
        'UPDATE waha_settings SET status = $1, last_sync = CURRENT_TIMESTAMP WHERE user_id = $2',
        [session.status, payload.userId]
      );

      return NextResponse.json({
        success: true,
        message: 'Sessão iniciada com sucesso!',
        session
      });

    } else if (action === 'stop') {
      // Parar sessão
      await client.stopSession();

      // Atualizar status
      await db.query(
        'UPDATE waha_settings SET status = $1, qr_code = NULL, last_sync = CURRENT_TIMESTAMP WHERE user_id = $2',
        ['stopped', payload.userId]
      );

      return NextResponse.json({
        success: true,
        message: 'Sessão parada com sucesso!'
      });

    } else if (action === 'restart') {
      // Reiniciar sessão
      await client.restartSession();

      return NextResponse.json({
        success: true,
        message: 'Sessão reiniciada com sucesso!'
      });

    } else if (action === 'logout') {
      // Fazer logout
      await client.logout();

      // Atualizar status
      await db.query(
        'UPDATE waha_settings SET status = $1, qr_code = NULL, last_sync = CURRENT_TIMESTAMP WHERE user_id = $2',
        ['disconnected', payload.userId]
      );

      return NextResponse.json({
        success: true,
        message: 'Logout realizado com sucesso!'
      });

    } else {
      return NextResponse.json({
        success: false,
        message: 'Ação inválida'
      }, { status: 400 });
    }

  } catch (error: any) {
    console.error('Erro ao gerenciar sessão:', error);
    return NextResponse.json({
      success: false,
      message: error.message || 'Erro ao gerenciar sessão'
    }, { status: 500 });
  }
}
