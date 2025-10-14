import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken, extractTokenFromHeader } from '@/lib/auth';

// GET /api/events/export-pdf - Gerar HTML para PDF da agenda
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const token = extractTokenFromHeader(request.headers.get('authorization'));
    if (!token) {
      return NextResponse.json({ message: 'Token não fornecido' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ message: 'Token inválido' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    // Buscar eventos
    let query = `
      SELECT e.id, e.title, e.description, e.start_time, e.end_time,
             e.location, e.event_type, e.phone, e.email,
             c.name as client_name,
             p.name as project_name
      FROM events e
      LEFT JOIN clients c ON e.client_id = c.id
      LEFT JOIN projects p ON e.project_id = p.id
      WHERE e.user_id = $1
    `;
    const params: any[] = [payload.userId];
    let paramIndex = 2;

    if (startDate) {
      query += ` AND e.start_time >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      query += ` AND e.start_time <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }

    query += ` ORDER BY e.start_time ASC`;

    const result = await db.query(query, params);

    // Gerar HTML para PDF
    const html = generatePDFHTML(result.rows, startDate, endDate);

    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });

  } catch (error: any) {
    console.error('Erro ao gerar PDF:', error);
    return NextResponse.json(
      { message: 'Erro ao gerar PDF' },
      { status: 500 }
    );
  }
}

function generatePDFHTML(events: any[], startDate: string | null, endDate: string | null): string {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR');
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const periodText = startDate && endDate
    ? `Período: ${formatDate(startDate)} até ${formatDate(endDate)}`
    : 'Todos os agendamentos';

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Agenda - Chatwell Pro</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: Arial, sans-serif;
            padding: 20px;
            color: #333;
        }

        .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 3px solid #3B82F6;
        }

        .header h1 {
            color: #1E40AF;
            font-size: 28px;
            margin-bottom: 10px;
        }

        .header .period {
            color: #6B7280;
            font-size: 14px;
        }

        .header .generated {
            color: #9CA3AF;
            font-size: 12px;
            margin-top: 5px;
        }

        .event {
            margin-bottom: 20px;
            padding: 15px;
            border: 1px solid #E5E7EB;
            border-left: 4px solid #3B82F6;
            page-break-inside: avoid;
            background: #F9FAFB;
        }

        .event-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 10px;
        }

        .event-title {
            font-size: 18px;
            font-weight: bold;
            color: #1E40AF;
            flex: 1;
        }

        .event-type {
            background: #DBEAFE;
            color: #1E40AF;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 11px;
            text-transform: uppercase;
            font-weight: bold;
        }

        .event-details {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
            margin-top: 10px;
        }

        .event-detail {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 14px;
            color: #4B5563;
        }

        .event-detail strong {
            color: #1F2937;
            min-width: 70px;
        }

        .event-description {
            margin-top: 10px;
            padding-top: 10px;
            border-top: 1px dashed #E5E7EB;
            font-size: 13px;
            color: #6B7280;
            line-height: 1.5;
        }

        .no-events {
            text-align: center;
            padding: 40px;
            color: #9CA3AF;
            font-size: 16px;
        }

        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #E5E7EB;
            text-align: center;
            color: #9CA3AF;
            font-size: 12px;
        }

        .summary {
            background: #EFF6FF;
            border: 1px solid #BFDBFE;
            padding: 15px;
            margin-bottom: 30px;
            border-radius: 8px;
        }

        .summary h2 {
            color: #1E40AF;
            font-size: 16px;
            margin-bottom: 10px;
        }

        .summary-stats {
            display: flex;
            justify-content: space-around;
            margin-top: 10px;
        }

        .stat {
            text-align: center;
        }

        .stat-value {
            font-size: 24px;
            font-weight: bold;
            color: #1E40AF;
        }

        .stat-label {
            font-size: 12px;
            color: #6B7280;
            margin-top: 5px;
        }

        @media print {
            body {
                padding: 15px;
            }
            .event {
                page-break-inside: avoid;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>📅 Agenda - Chatwell Pro</h1>
        <div class="period">${periodText}</div>
        <div class="generated">Gerado em: ${new Date().toLocaleString('pt-BR')}</div>
    </div>

    <div class="summary">
        <h2>Resumo</h2>
        <div class="summary-stats">
            <div class="stat">
                <div class="stat-value">${events.length}</div>
                <div class="stat-label">Total de Agendamentos</div>
            </div>
        </div>
    </div>

    ${events.length === 0 ? `
        <div class="no-events">
            Nenhum agendamento encontrado para o período selecionado.
        </div>
    ` : events.map(event => `
        <div class="event">
            <div class="event-header">
                <div class="event-title">${event.title}</div>
                <div class="event-type">${getEventTypeLabel(event.event_type)}</div>
            </div>

            <div class="event-details">
                <div class="event-detail">
                    <strong>📅 Data:</strong>
                    <span>${formatDate(event.start_time)}</span>
                </div>
                <div class="event-detail">
                    <strong>⏰ Horário:</strong>
                    <span>${formatTime(event.start_time)} - ${formatTime(event.end_time)}</span>
                </div>
                ${event.location ? `
                <div class="event-detail">
                    <strong>📍 Local:</strong>
                    <span>${event.location}</span>
                </div>
                ` : ''}
                ${event.client_name ? `
                <div class="event-detail">
                    <strong>👤 Cliente:</strong>
                    <span>${event.client_name}</span>
                </div>
                ` : ''}
                ${event.project_name ? `
                <div class="event-detail">
                    <strong>📁 Projeto:</strong>
                    <span>${event.project_name}</span>
                </div>
                ` : ''}
                ${event.phone ? `
                <div class="event-detail">
                    <strong>📱 Telefone:</strong>
                    <span>${event.phone}</span>
                </div>
                ` : ''}
                ${event.email ? `
                <div class="event-detail">
                    <strong>📧 Email:</strong>
                    <span>${event.email}</span>
                </div>
                ` : ''}
            </div>

            ${event.description ? `
            <div class="event-description">
                <strong>Descrição:</strong> ${event.description}
            </div>
            ` : ''}
        </div>
    `).join('')}

    <div class="footer">
        <p>Chatwell Pro - Sistema de Gestão Empresarial</p>
        <p>Este relatório foi gerado automaticamente.</p>
    </div>
</body>
</html>
  `;
}

function getEventTypeLabel(type: string): string {
  const labels: { [key: string]: string } = {
    'meeting': 'Reunião',
    'call': 'Ligação',
    'task': 'Tarefa',
    'appointment': 'Compromisso',
    'other': 'Outro'
  };
  return labels[type] || type;
}
