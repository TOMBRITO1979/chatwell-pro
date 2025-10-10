import { NextRequest, NextResponse } from 'next/server';
import { sendDailyEventReminders } from '@/lib/notifications';

/**
 * POST /api/notifications/daily-events
 * Envia lembretes diários de eventos (Tarefa 4.2)
 * Deve ser executado todos os dias às 18h via cron job
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar se a requisição vem de uma fonte autorizada (opcional)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'chatwell-cron-secret';

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { message: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Executar envio de lembretes
    await sendDailyEventReminders('');

    return NextResponse.json({
      success: true,
      message: 'Lembretes de eventos enviados com sucesso!'
    });

  } catch (error: any) {
    console.error('Erro ao enviar lembretes de eventos:', error);
    return NextResponse.json(
      { message: 'Erro ao enviar lembretes' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/notifications/daily-events
 * Endpoint de teste (apenas para desenvolvimento)
 */
export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { message: 'Endpoint disponível apenas em desenvolvimento' },
      { status: 403 }
    );
  }

  try {
    await sendDailyEventReminders('');

    return NextResponse.json({
      success: true,
      message: 'Teste de lembretes executado com sucesso!'
    });
  } catch (error: any) {
    console.error('Erro ao testar lembretes:', error);
    return NextResponse.json(
      { message: 'Erro ao testar lembretes' },
      { status: 500 }
    );
  }
}
