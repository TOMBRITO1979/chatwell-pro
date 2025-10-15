/**
 * Instrumentation file for Next.js 14+
 * This file runs once when the server starts
 * Docs: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  // Only run on server side
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    console.log('🚀 Inicializando serviços do servidor...');

    try {
      // Inicializa o worker de lembretes
      const { startReminderWorker } = await import('./lib/queue');
      startReminderWorker();
      console.log('✅ Worker de lembretes inicializado');
    } catch (error) {
      console.error('❌ Erro ao inicializar worker de lembretes:', error);
      // Não falha a aplicação se o worker falhar
    }
  }
}
