/**
 * Voice Command Parser
 *
 * Analisa transcrições de comandos de voz e extrai informações estruturadas
 * para criar eventos ou contas automaticamente.
 */

interface ParsedCommand {
  success: boolean;
  type?: 'event' | 'account';
  data?: any;
  extracted_info?: any;
  error?: string;
}

/**
 * Parse comando de voz e determina se é evento ou conta
 */
export async function parseVoiceCommand(
  transcription: string,
  typeHint: 'auto' | 'event' | 'account' = 'auto'
): Promise<ParsedCommand> {
  const text = transcription.toLowerCase().trim();

  // Se tipo foi especificado, usa diretamente
  if (typeHint === 'event') {
    return parseEventCommand(text, transcription);
  } else if (typeHint === 'account') {
    return parseAccountCommand(text, transcription);
  }

  // Auto-detecção baseada em palavras-chave
  const eventKeywords = [
    'agendar', 'reunião', 'meeting', 'compromisso', 'consulta',
    'encontro', 'evento', 'marcar', 'appointment', 'call', 'ligação'
  ];

  const accountKeywords = [
    'conta', 'pagar', 'pagamento', 'vencimento', 'boleto',
    'fatura', 'receber', 'valor', 'bill', 'invoice', 'despesa'
  ];

  const hasEventKeyword = eventKeywords.some(keyword => text.includes(keyword));
  const hasAccountKeyword = accountKeywords.some(keyword => text.includes(keyword));

  // Se detectou ambos, prioriza evento (mais comum em comandos de voz)
  if (hasEventKeyword) {
    return parseEventCommand(text, transcription);
  } else if (hasAccountKeyword) {
    return parseAccountCommand(text, transcription);
  }

  // Não conseguiu identificar
  return {
    success: false,
    error: 'Não consegui identificar se é um evento ou conta. Use palavras como "agendar", "reunião" para eventos ou "conta", "pagar", "boleto" para contas.'
  };
}

/**
 * Parse comando de evento/compromisso
 */
function parseEventCommand(text: string, originalText: string): ParsedCommand {
  try {
    // Extrair título/descrição
    const title = extractEventTitle(text, originalText);

    // Extrair data e hora
    const dateTime = extractDateTime(text);

    if (!dateTime.start_time) {
      return {
        success: false,
        error: 'Não consegui identificar a data/hora. Tente falar algo como "amanhã às 15 horas" ou "dia 25 às 10h".'
      };
    }

    // Extrair localização (opcional)
    const location = extractLocation(text);

    // Determinar tipo de evento
    const event_type = determineEventType(text);

    // Calcular end_time (padrão: 1 hora depois)
    const start = new Date(dateTime.start_time);
    const end = new Date(start.getTime() + (dateTime.duration || 60) * 60 * 1000);

    return {
      success: true,
      type: 'event',
      data: {
        title: title || 'Evento criado por voz',
        description: `Comando original: "${originalText}"`,
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        location,
        event_type,
        is_all_day: dateTime.is_all_day || false,
        reminder_minutes: 30,
        color: event_type === 'meeting' ? '#3B82F6' : '#10bb82'
      },
      extracted_info: {
        title,
        date: dateTime.date_description,
        time: dateTime.time_description,
        location,
        event_type
      }
    };
  } catch (error: any) {
    return {
      success: false,
      error: `Erro ao processar evento: ${error.message}`
    };
  }
}

/**
 * Parse comando de conta a pagar/receber
 */
function parseAccountCommand(text: string, originalText: string): ParsedCommand {
  try {
    // Extrair título
    const title = extractAccountTitle(text, originalText);

    // Extrair valor
    const amount = extractAmount(text);

    if (!amount) {
      return {
        success: false,
        error: 'Não consegui identificar o valor. Tente falar algo como "350 reais" ou "R$ 1500".'
      };
    }

    // Extrair data de vencimento
    const dueDate = extractDueDate(text);

    if (!dueDate) {
      return {
        success: false,
        error: 'Não consegui identificar a data de vencimento. Tente falar algo como "vence dia 25" ou "para o dia 15".'
      };
    }

    // Determinar tipo (pagar ou receber)
    const type = text.includes('receber') || text.includes('receita') ? 'receivable' : 'expense';

    // Extrair categoria (opcional)
    const category = extractCategory(text);

    return {
      success: true,
      type: 'account',
      data: {
        title: title || 'Conta criada por voz',
        description: `Comando original: "${originalText}"`,
        amount,
        due_date: dueDate.toISOString().split('T')[0],
        type,
        status: 'pending',
        category
      },
      extracted_info: {
        title,
        amount: `R$ ${amount.toFixed(2)}`,
        due_date: dueDate.toLocaleDateString('pt-BR'),
        type: type === 'receivable' ? 'a receber' : 'a pagar',
        category
      }
    };
  } catch (error: any) {
    return {
      success: false,
      error: `Erro ao processar conta: ${error.message}`
    };
  }
}

/**
 * Extrai título do evento
 */
function extractEventTitle(text: string, original: string): string {
  // Tenta extrair entre palavras-chave e preposições
  const patterns = [
    /(?:agendar|marcar|criar)\s+(?:uma?\s+)?(.+?)(?:\s+(?:para|no|na|em|às?|dia|amanhã|hoje|semana|mês))/i,
    /(?:reunião|meeting|consulta|compromisso)\s+(?:com|sobre|de)\s+(.+?)(?:\s+(?:para|no|na|em|às?|dia|amanhã|hoje))/i,
    /(.+?)(?:\s+(?:amanhã|hoje|dia|semana que vem))/i
  ];

  for (const pattern of patterns) {
    const match = original.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  // Fallback: primeiras 5 palavras
  const words = original.split(' ').slice(0, 5).join(' ');
  return words || 'Evento';
}

/**
 * Extrai data e hora do texto
 */
function extractDateTime(text: string): any {
  const now = new Date();
  let targetDate = new Date();
  let hours = 9; // padrão 9h
  let minutes = 0;
  let is_all_day = false;
  let duration = 1; // 1 hora padrão

  // Detectar dia
  if (text.includes('hoje')) {
    // mantém data atual
  } else if (text.includes('amanhã')) {
    targetDate.setDate(targetDate.getDate() + 1);
  } else if (text.includes('depois de amanhã')) {
    targetDate.setDate(targetDate.getDate() + 2);
  } else if (text.includes('semana que vem') || text.includes('próxima semana')) {
    targetDate.setDate(targetDate.getDate() + 7);
  } else if (text.includes('mês que vem') || text.includes('próximo mês')) {
    targetDate.setMonth(targetDate.getMonth() + 1);
  } else {
    // Tenta extrair "dia X" ou "dia X de Y"
    const dayMatch = text.match(/dia\s+(\d{1,2})(?:\s+de\s+(\w+))?/i);
    if (dayMatch) {
      const day = parseInt(dayMatch[1]);
      targetDate.setDate(day);

      // Se já passou este dia no mês atual, vai para o próximo mês
      if (targetDate < now) {
        targetDate.setMonth(targetDate.getMonth() + 1);
      }

      if (dayMatch[2]) {
        const monthName = dayMatch[2].toLowerCase();
        const months = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
                       'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
        const monthIndex = months.findIndex(m => m.startsWith(monthName));
        if (monthIndex !== -1) {
          targetDate.setMonth(monthIndex);
        }
      }
    }
  }

  // Detectar hora
  const timePatterns = [
    /(\d{1,2})[h:](\d{2})/,  // 14h30, 14:30
    /(\d{1,2})\s*h(?:oras?)?/,  // 14h, 14 horas
    /às\s+(\d{1,2})/,  // às 14
  ];

  for (const pattern of timePatterns) {
    const match = text.match(pattern);
    if (match) {
      hours = parseInt(match[1]);
      minutes = match[2] ? parseInt(match[2]) : 0;
      break;
    }
  }

  // Ajustes de horário baseados em contexto
  if (text.includes('manhã') && hours > 12) hours -= 12;
  if (text.includes('tarde') && hours < 12) hours += 12;
  if (text.includes('noite') && hours < 18) hours += 12;

  // Detectar "dia inteiro" ou "o dia todo"
  if (text.includes('dia inteiro') || text.includes('o dia todo') || text.includes('dia todo')) {
    is_all_day = true;
    hours = 0;
    minutes = 0;
  }

  // Detectar duração
  const durationMatch = text.match(/(\d+)\s*(?:hora|hr|h)/);
  if (durationMatch) {
    duration = parseInt(durationMatch[1]);
  }

  targetDate.setHours(hours, minutes, 0, 0);

  return {
    start_time: targetDate.toISOString(),
    is_all_day,
    duration,
    date_description: targetDate.toLocaleDateString('pt-BR'),
    time_description: is_all_day ? 'dia inteiro' : `${hours}:${minutes.toString().padStart(2, '0')}`
  };
}

/**
 * Extrai localização
 */
function extractLocation(text: string): string | null {
  const patterns = [
    /(?:em|no|na)\s+([A-Za-zÀ-ú\s]+?)(?:\s+(?:às?|dia|para|com))/i,
    /local[:\s]+([^,.;]+)/i,
    /endereço[:\s]+([^,.;]+)/i
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  return null;
}

/**
 * Determina tipo de evento
 */
function determineEventType(text: string): string {
  if (text.includes('reunião') || text.includes('meeting')) return 'meeting';
  if (text.includes('call') || text.includes('ligação') || text.includes('chamada')) return 'call';
  if (text.includes('consulta') || text.includes('appointment')) return 'appointment';
  if (text.includes('online') || text.includes('zoom') || text.includes('meet')) return 'online';
  return 'meeting';
}

/**
 * Extrai título da conta
 */
function extractAccountTitle(text: string, original: string): string {
  const patterns = [
    /(?:conta|boleto|fatura)\s+(?:de|da|do)\s+(.+?)(?:\s+(?:no valor|vence|para|de R))/i,
    /(?:pagar|receber)\s+(.+?)(?:\s+(?:no valor|vence|para|dia))/i,
    /(.+?)(?:\s+(?:vence|no valor))/i
  ];

  for (const pattern of patterns) {
    const match = original.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  return original.split(' ').slice(0, 4).join(' ') || 'Conta';
}

/**
 * Extrai valor monetário
 */
function extractAmount(text: string): number | null {
  const patterns = [
    /R\$?\s*(\d+(?:[.,]\d{2})?)/i,
    /(\d+(?:[.,]\d{2})?)\s*reais/i,
    /valor\s+(?:de\s+)?R?\$?\s*(\d+(?:[.,]\d{2})?)/i,
    /(\d+(?:[.,]\d{2})?)\s*(?:R\$|reais)/i,
    /(\d+)\s+e\s+(\d+)\s+centavos/i,  // "150 e 50 centavos"
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      if (match[2]) {
        // Formato "X e Y centavos"
        return parseFloat(match[1]) + parseFloat(match[2]) / 100;
      }
      const value = match[1].replace(',', '.');
      return parseFloat(value);
    }
  }

  return null;
}

/**
 * Extrai data de vencimento
 */
function extractDueDate(text: string): Date | null {
  const now = new Date();
  let targetDate = new Date();

  // Padrões de data
  if (text.includes('hoje')) {
    return targetDate;
  } else if (text.includes('amanhã')) {
    targetDate.setDate(targetDate.getDate() + 1);
    return targetDate;
  }

  // "dia X" ou "vence dia X"
  const dayMatch = text.match(/(?:dia|vence)\s+(?:dia\s+)?(\d{1,2})(?:\s+de\s+(\w+))?/i);
  if (dayMatch) {
    const day = parseInt(dayMatch[1]);
    targetDate.setDate(day);

    // Se já passou, vai para próximo mês
    if (targetDate < now) {
      targetDate.setMonth(targetDate.getMonth() + 1);
    }

    if (dayMatch[2]) {
      const monthName = dayMatch[2].toLowerCase();
      const months = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
                     'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
      const monthIndex = months.findIndex(m => m.startsWith(monthName));
      if (monthIndex !== -1) {
        targetDate.setMonth(monthIndex);
      }
    }

    return targetDate;
  }

  // Formato DD/MM ou DD/MM/YYYY
  const dateMatch = text.match(/(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/);
  if (dateMatch) {
    const day = parseInt(dateMatch[1]);
    const month = parseInt(dateMatch[2]) - 1;
    const year = dateMatch[3] ? parseInt(dateMatch[3]) : now.getFullYear();

    return new Date(year, month, day);
  }

  return null;
}

/**
 * Extrai categoria da conta
 */
function extractCategory(text: string): string | null {
  const categories: { [key: string]: string } = {
    'energia': 'Energia',
    'luz': 'Energia',
    'água': 'Água',
    'internet': 'Internet',
    'telefone': 'Telefone',
    'celular': 'Telefone',
    'aluguel': 'Aluguel',
    'condomínio': 'Condomínio',
    'gás': 'Gás',
    'combustível': 'Combustível',
    'gasolina': 'Combustível',
    'mercado': 'Alimentação',
    'supermercado': 'Alimentação',
    'farmácia': 'Saúde',
    'médico': 'Saúde',
    'dentista': 'Saúde'
  };

  for (const [keyword, category] of Object.entries(categories)) {
    if (text.includes(keyword)) {
      return category;
    }
  }

  return null;
}
