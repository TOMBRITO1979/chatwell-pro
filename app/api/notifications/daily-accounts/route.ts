import { NextRequest, NextResponse } from 'next/server';
import { sendDailyAccountReminders } from '@/lib/notifications';

/**
 * POST /api/notifications/daily-accounts
 * Envia lembretes diários de contas a vencer (Tarefa 4.3)
 * Deve ser executado todos os dias às 20h via cron job
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
    await sendDailyAccountReminders();

    return NextResponse.json({
      success: true,
      message: 'Lembretes de contas enviados com sucesso!'
    });

  } catch (error: any) {
    console.error('Erro ao enviar lembretes de contas:', error);
    return NextResponse.json(
      { message: 'Erro ao enviar lembretes' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/notifications/daily-accounts
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
    await sendDailyAccountReminders();

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
