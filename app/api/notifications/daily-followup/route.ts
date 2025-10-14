import { NextRequest, NextResponse } from 'next/server';
import { sendDailyEventFollowUp } from '@/lib/notifications';

// POST /api/notifications/daily-followup - Executar follow-up diário de agendamentos
export async function POST(request: NextRequest) {
  try {
    console.log('🔔 API: Iniciando follow-up diário de agendamentos...');

    // Executar follow-up
    await sendDailyEventFollowUp();

    return NextResponse.json({
      success: true,
      message: 'Follow-up diário executado com sucesso!'
    });

  } catch (error: any) {
    console.error('Erro ao executar follow-up diário:', error);
    return NextResponse.json({
      success: false,
      message: 'Erro ao executar follow-up diário: ' + error.message
    }, { status: 500 });
  }
}

// GET /api/notifications/daily-followup - Executar follow-up diário (para cron jobs)
export async function GET(request: NextRequest) {
  try {
    console.log('🔔 API (GET): Iniciando follow-up diário de agendamentos...');

    // Executar follow-up
    await sendDailyEventFollowUp();

    return NextResponse.json({
      success: true,
      message: 'Follow-up diário executado com sucesso!'
    });

  } catch (error: any) {
    console.error('Erro ao executar follow-up diário:', error);
    return NextResponse.json({
      success: false,
      message: 'Erro ao executar follow-up diário: ' + error.message
    }, { status: 500 });
  }
}
