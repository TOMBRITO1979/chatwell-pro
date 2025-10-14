import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken, extractTokenFromHeader } from '@/lib/auth';

// GET /api/accounts/export-pdf - Gerar PDF de extrato de fluxo de caixa
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

    // Buscar contas
    let query = `
      SELECT id, description, amount, type, category, due_date,
             payment_date, status, notes, created_at
      FROM accounts
      WHERE user_id = $1
    `;
    const params: any[] = [payload.userId];
    let paramIndex = 2;

    if (startDate) {
      query += ` AND due_date >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      query += ` AND due_date <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }

    query += ` ORDER BY due_date ASC, created_at ASC`;

    const result = await db.query(query, params);

    // Calcular totais
    const totals = {
      receitas: 0,
      despesas: 0,
      saldo: 0,
      receitasPagas: 0,
      receitasPendentes: 0,
      despesasPagas: 0,
      despesasPendentes: 0
    };

    result.rows.forEach((account: any) => {
      const amount = parseFloat(account.amount);

      if (account.type === 'income') {
        totals.receitas += amount;
        if (account.status === 'paid') {
          totals.receitasPagas += amount;
        } else {
          totals.receitasPendentes += amount;
        }
      } else {
        totals.despesas += amount;
        if (account.status === 'paid') {
          totals.despesasPagas += amount;
        } else {
          totals.despesasPendentes += amount;
        }
      }
    });

    totals.saldo = totals.receitas - totals.despesas;

    // Gerar HTML para PDF
    const html = generateCashFlowPDF(result.rows, totals, startDate, endDate);

    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });

  } catch (error: any) {
    console.error('Erro ao gerar PDF de fluxo de caixa:', error);
    return NextResponse.json(
      { message: 'Erro ao gerar PDF' },
      { status: 500 }
    );
  }
}

function generateCashFlowPDF(accounts: any[], totals: any, startDate: string | null, endDate: string | null): string {
  const formatDate = (dateStr: string) => {
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
    : 'Todos os registros';

  const getStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      'pending': 'Pendente',
      'paid': 'Pago',
      'overdue': 'Vencido'
    };
    return labels[status] || status;
  };

  const getTypeLabel = (type: string) => {
    return type === 'income' ? 'Receita' : 'Despesa';
  };

  const getCategoryLabel = (category: string) => {
    const labels: { [key: string]: string } = {
      'salary': 'Salário',
      'service': 'Serviço',
      'product': 'Produto',
      'investment': 'Investimento',
      'rent': 'Aluguel',
      'utilities': 'Utilidades',
      'supplies': 'Suprimentos',
      'other': 'Outro'
    };
    return labels[category] || category;
  };

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Extrato de Fluxo de Caixa - Chatwell Pro</title>
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
            border-bottom: 3px solid #10B981;
        }

        .header h1 {
            color: #059669;
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
            background: #F0FDF4;
            border: 2px solid #10B981;
            padding: 20px;
            margin-bottom: 30px;
            border-radius: 8px;
        }

        .summary h2 {
            color: #059669;
            font-size: 18px;
            margin-bottom: 15px;
            text-align: center;
        }

        .summary-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 15px;
            margin-bottom: 15px;
        }

        .summary-item {
            text-align: center;
            padding: 10px;
            background: white;
            border-radius: 6px;
        }

        .summary-label {
            font-size: 12px;
            color: #6B7280;
            margin-bottom: 5px;
        }

        .summary-value {
            font-size: 20px;
            font-weight: bold;
        }

        .summary-value.positive {
            color: #059669;
        }

        .summary-value.negative {
            color: #DC2626;
        }

        .summary-value.neutral {
            color: #3B82F6;
        }

        .summary-saldo {
            grid-column: span 3;
            background: #DBEAFE;
            border: 2px solid #3B82F6;
            padding: 15px;
        }

        .summary-saldo .summary-value {
            font-size: 28px;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }

        thead {
            background: #F3F4F6;
        }

        th {
            padding: 12px;
            text-align: left;
            font-size: 12px;
            font-weight: bold;
            color: #374151;
            border-bottom: 2px solid #D1D5DB;
        }

        tbody tr {
            border-bottom: 1px solid #E5E7EB;
        }

        tbody tr:hover {
            background: #F9FAFB;
        }

        td {
            padding: 12px;
            font-size: 13px;
            color: #4B5563;
        }

        .type-badge {
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: bold;
            text-transform: uppercase;
        }

        .type-badge.income {
            background: #D1FAE5;
            color: #065F46;
        }

        .type-badge.expense {
            background: #FEE2E2;
            color: #991B1B;
        }

        .status-badge {
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: bold;
        }

        .status-badge.paid {
            background: #D1FAE5;
            color: #065F46;
        }

        .status-badge.pending {
            background: #FEF3C7;
            color: #92400E;
        }

        .status-badge.overdue {
            background: #FEE2E2;
            color: #991B1B;
        }

        .amount {
            font-weight: bold;
        }

        .amount.income {
            color: #059669;
        }

        .amount.expense {
            color: #DC2626;
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
            tbody tr {
                page-break-inside: avoid;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>💰 Extrato de Fluxo de Caixa</h1>
        <div class="period">${periodText}</div>
        <div class="generated">Gerado em: ${new Date().toLocaleString('pt-BR')}</div>
    </div>

    <div class="summary">
        <h2>Resumo Financeiro</h2>
        <div class="summary-grid">
            <div class="summary-item">
                <div class="summary-label">Total Receitas</div>
                <div class="summary-value positive">${formatCurrency(totals.receitas)}</div>
                <div class="summary-label" style="margin-top: 5px; font-size: 10px;">
                    Pagas: ${formatCurrency(totals.receitasPagas)} | Pendentes: ${formatCurrency(totals.receitasPendentes)}
                </div>
            </div>
            <div class="summary-item">
                <div class="summary-label">Total Despesas</div>
                <div class="summary-value negative">${formatCurrency(totals.despesas)}</div>
                <div class="summary-label" style="margin-top: 5px; font-size: 10px;">
                    Pagas: ${formatCurrency(totals.despesasPagas)} | Pendentes: ${formatCurrency(totals.despesasPendentes)}
                </div>
            </div>
            <div class="summary-item">
                <div class="summary-label">Quantidade</div>
                <div class="summary-value neutral">${accounts.length}</div>
                <div class="summary-label" style="margin-top: 5px; font-size: 10px;">
                    Total de lançamentos
                </div>
            </div>
            <div class="summary-item summary-saldo">
                <div class="summary-label">Saldo do Período</div>
                <div class="summary-value ${totals.saldo >= 0 ? 'positive' : 'negative'}">
                    ${formatCurrency(totals.saldo)}
                </div>
            </div>
        </div>
    </div>

    ${accounts.length === 0 ? `
        <div class="no-records">
            Nenhum lançamento encontrado para o período selecionado.
        </div>
    ` : `
        <table>
            <thead>
                <tr>
                    <th>Data Venc.</th>
                    <th>Descrição</th>
                    <th>Tipo</th>
                    <th>Categoria</th>
                    <th>Status</th>
                    <th>Data Pagto.</th>
                    <th style="text-align: right;">Valor</th>
                </tr>
            </thead>
            <tbody>
                ${accounts.map(account => `
                    <tr>
                        <td>${formatDate(account.due_date)}</td>
                        <td>${account.description}</td>
                        <td>
                            <span class="type-badge ${account.type}">
                                ${getTypeLabel(account.type)}
                            </span>
                        </td>
                        <td>${getCategoryLabel(account.category)}</td>
                        <td>
                            <span class="status-badge ${account.status}">
                                ${getStatusLabel(account.status)}
                            </span>
                        </td>
                        <td>${account.payment_date ? formatDate(account.payment_date) : '-'}</td>
                        <td style="text-align: right;">
                            <span class="amount ${account.type}">
                                ${account.type === 'income' ? '+' : '-'} ${formatCurrency(parseFloat(account.amount))}
                            </span>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `}

    <div class="footer">
        <p>Chatwell Pro - Sistema de Gestão Empresarial</p>
        <p>Este relatório foi gerado automaticamente.</p>
    </div>
</body>
</html>
  `;
}
