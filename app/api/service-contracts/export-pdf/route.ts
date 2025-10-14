import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken, extractTokenFromHeader } from '@/lib/auth';

// GET /api/service-contracts/export-pdf - Gerar PDF de relatório de serviços
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
    const status = searchParams.get('status'); // 'started', 'completed', 'all'

    // Buscar serviços
    let query = `
      SELECT sc.id, sc.title, sc.description, sc.start_date, sc.end_date,
             sc.value, sc.status, sc.notes, sc.created_at,
             c.name as client_name,
             p.name as project_name
      FROM service_contracts sc
      LEFT JOIN clients c ON sc.client_id = c.id
      LEFT JOIN projects p ON sc.project_id = p.id
      WHERE sc.user_id = $1
    `;
    const params: any[] = [payload.userId];
    let paramIndex = 2;

    if (startDate) {
      query += ` AND sc.start_date >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      query += ` AND sc.start_date <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }

    if (status && status !== 'all') {
      query += ` AND sc.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    query += ` ORDER BY sc.start_date ASC`;

    const result = await db.query(query, params);

    // Calcular estatísticas
    const stats = {
      total: result.rows.length,
      iniciados: 0,
      concluidos: 0,
      cancelados: 0,
      valorTotal: 0,
      valorIniciados: 0,
      valorConcluidos: 0
    };

    result.rows.forEach((service: any) => {
      const value = parseFloat(service.value || 0);
      stats.valorTotal += value;

      if (service.status === 'in_progress') {
        stats.iniciados++;
        stats.valorIniciados += value;
      } else if (service.status === 'completed') {
        stats.concluidos++;
        stats.valorConcluidos += value;
      } else if (service.status === 'cancelled') {
        stats.cancelados++;
      }
    });

    // Gerar HTML para PDF
    const html = generateServicesPDF(result.rows, stats, startDate, endDate, status);

    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });

  } catch (error: any) {
    console.error('Erro ao gerar PDF de serviços:', error);
    return NextResponse.json(
      { message: 'Erro ao gerar PDF' },
      { status: 500 }
    );
  }
}

function generateServicesPDF(services: any[], stats: any, startDate: string | null, endDate: string | null, statusFilter: string | null): string {
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const periodText = startDate && endDate
    ? `Período: ${formatDate(startDate)} até ${formatDate(endDate)}`
    : 'Todos os serviços';

  const getStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      'pending': 'Pendente',
      'in_progress': 'Em Andamento',
      'completed': 'Concluído',
      'cancelled': 'Cancelado'
    };
    return labels[status] || status;
  };

  const filterText = statusFilter && statusFilter !== 'all'
    ? ` - Filtro: ${getStatusLabel(statusFilter)}`
    : '';

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Relatório de Serviços - Chatwell Pro</title>
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
            border-bottom: 3px solid #8B5CF6;
        }

        .header h1 {
            color: #7C3AED;
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

        .summary {
            background: #F5F3FF;
            border: 2px solid #8B5CF6;
            padding: 20px;
            margin-bottom: 30px;
            border-radius: 8px;
        }

        .summary h2 {
            color: #7C3AED;
            font-size: 18px;
            margin-bottom: 15px;
            text-align: center;
        }

        .summary-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 15px;
        }

        .summary-item {
            text-align: center;
            padding: 15px;
            background: white;
            border-radius: 6px;
            border: 1px solid #E5E7EB;
        }

        .summary-label {
            font-size: 12px;
            color: #6B7280;
            margin-bottom: 5px;
        }

        .summary-value {
            font-size: 24px;
            font-weight: bold;
            color: #7C3AED;
        }

        .summary-subtext {
            font-size: 11px;
            color: #9CA3AF;
            margin-top: 5px;
        }

        .service-card {
            background: white;
            border: 1px solid #E5E7EB;
            border-left: 4px solid #8B5CF6;
            padding: 15px;
            margin-bottom: 15px;
            border-radius: 6px;
            page-break-inside: avoid;
        }

        .service-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 10px;
        }

        .service-title {
            font-size: 16px;
            font-weight: bold;
            color: #1F2937;
            flex: 1;
        }

        .status-badge {
            padding: 4px 10px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: bold;
            text-transform: uppercase;
        }

        .status-badge.pending {
            background: #FEF3C7;
            color: #92400E;
        }

        .status-badge.in_progress {
            background: #DBEAFE;
            color: #1E40AF;
        }

        .status-badge.completed {
            background: #D1FAE5;
            color: #065F46;
        }

        .status-badge.cancelled {
            background: #FEE2E2;
            color: #991B1B;
        }

        .service-details {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
            margin-top: 10px;
            padding-top: 10px;
            border-top: 1px dashed #E5E7EB;
        }

        .service-detail {
            font-size: 13px;
            color: #4B5563;
        }

        .service-detail strong {
            color: #1F2937;
            display: block;
            margin-bottom: 3px;
        }

        .service-description {
            margin-top: 10px;
            padding: 10px;
            background: #F9FAFB;
            border-radius: 4px;
            font-size: 13px;
            color: #6B7280;
        }

        .service-value {
            font-size: 18px;
            font-weight: bold;
            color: #059669;
            margin-top: 10px;
        }

        .no-records {
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

        @media print {
            body {
                padding: 15px;
            }
            .service-card {
                page-break-inside: avoid;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>📋 Relatório de Serviços</h1>
        <div class="period">${periodText}${filterText}</div>
        <div class="generated">Gerado em: ${new Date().toLocaleString('pt-BR')}</div>
    </div>

    <div class="summary">
        <h2>Resumo Geral</h2>
        <div class="summary-grid">
            <div class="summary-item">
                <div class="summary-label">Total de Serviços</div>
                <div class="summary-value">${stats.total}</div>
            </div>
            <div class="summary-item">
                <div class="summary-label">Em Andamento</div>
                <div class="summary-value">${stats.iniciados}</div>
                <div class="summary-subtext">${formatCurrency(stats.valorIniciados)}</div>
            </div>
            <div class="summary-item">
                <div class="summary-label">Concluídos</div>
                <div class="summary-value">${stats.concluidos}</div>
                <div class="summary-subtext">${formatCurrency(stats.valorConcluidos)}</div>
            </div>
            <div class="summary-item">
                <div class="summary-label">Cancelados</div>
                <div class="summary-value">${stats.cancelados}</div>
            </div>
            <div class="summary-item">
                <div class="summary-label">Valor Total</div>
                <div class="summary-value" style="color: #059669;">${formatCurrency(stats.valorTotal)}</div>
            </div>
            <div class="summary-item">
                <div class="summary-label">Taxa de Conclusão</div>
                <div class="summary-value">${stats.total > 0 ? Math.round((stats.concluidos / stats.total) * 100) : 0}%</div>
            </div>
        </div>
    </div>

    ${services.length === 0 ? `
        <div class="no-records">
            Nenhum serviço encontrado para o período selecionado.
        </div>
    ` : services.map(service => `
        <div class="service-card">
            <div class="service-header">
                <div class="service-title">${service.title}</div>
                <span class="status-badge ${service.status}">
                    ${getStatusLabel(service.status)}
                </span>
            </div>

            ${service.description ? `
            <div class="service-description">
                ${service.description}
            </div>
            ` : ''}

            <div class="service-details">
                <div class="service-detail">
                    <strong>📅 Data Início:</strong>
                    ${formatDate(service.start_date)}
                </div>
                <div class="service-detail">
                    <strong>⏰ Data Fim:</strong>
                    ${formatDate(service.end_date)}
                </div>
                ${service.client_name ? `
                <div class="service-detail">
                    <strong>👤 Cliente:</strong>
                    ${service.client_name}
                </div>
                ` : ''}
                ${service.project_name ? `
                <div class="service-detail">
                    <strong>📁 Projeto:</strong>
                    ${service.project_name}
                </div>
                ` : ''}
            </div>

            ${service.value ? `
            <div class="service-value">
                💰 Valor: ${formatCurrency(parseFloat(service.value))}
            </div>
            ` : ''}

            ${service.notes ? `
            <div style="margin-top: 10px; padding: 8px; background: #FEF3C7; border-radius: 4px; font-size: 12px; color: #92400E;">
                <strong>Observações:</strong> ${service.notes}
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
