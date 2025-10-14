import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken, extractTokenFromHeader } from '@/lib/auth';

// GET /api/accounts/export-csv - Exportar extrato para CSV
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
      SELECT description, amount, type, category, due_date,
             payment_date, status, notes
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

    query += ` ORDER BY due_date ASC`;

    const result = await db.query(query, params);

    if (result.rows.length === 0) {
      return NextResponse.json({
        message: 'Nenhum lançamento encontrado para exportar'
      }, { status: 404 });
    }

    // Gerar CSV
    const headers = [
      'Data Vencimento',
      'Descrição',
      'Tipo',
      'Categoria',
      'Status',
      'Data Pagamento',
      'Valor',
      'Observações'
    ];

    // Função auxiliar para escapar valores CSV
    const escapeCSV = (value: any): string => {
      if (value === null || value === undefined) return '';
      const stringValue = String(value);
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    };

    const formatDate = (dateStr: string) => {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      return date.toLocaleDateString('pt-BR');
    };

    const getTypeLabel = (type: string) => {
      return type === 'income' ? 'Receita' : 'Despesa';
    };

    const getStatusLabel = (status: string) => {
      const labels: { [key: string]: string } = {
        'pending': 'Pendente',
        'paid': 'Pago',
        'overdue': 'Vencido'
      };
      return labels[status] || status;
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

    // Montar linhas do CSV
    const csvLines = [headers.join(',')];

    result.rows.forEach(account => {
      const row = [
        escapeCSV(formatDate(account.due_date)),
        escapeCSV(account.description),
        escapeCSV(getTypeLabel(account.type)),
        escapeCSV(getCategoryLabel(account.category)),
        escapeCSV(getStatusLabel(account.status)),
        escapeCSV(account.payment_date ? formatDate(account.payment_date) : ''),
        escapeCSV(parseFloat(account.amount).toFixed(2)),
        escapeCSV(account.notes)
      ];
      csvLines.push(row.join(','));
    });

    const csvContent = csvLines.join('\n');

    // Retornar CSV com headers apropriados
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="extrato_${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });

  } catch (error: any) {
    console.error('Erro ao exportar CSV:', error);
    return NextResponse.json(
      { message: 'Erro ao exportar CSV' },
      { status: 500 }
    );
  }
}
