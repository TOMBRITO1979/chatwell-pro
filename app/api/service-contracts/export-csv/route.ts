import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken, extractTokenFromHeader } from '@/lib/auth';

// GET /api/service-contracts/export-csv - Exportar serviços para CSV
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
    const status = searchParams.get('status');

    // Buscar serviços
    let query = `
      SELECT sc.title, sc.description, sc.start_date, sc.end_date,
             sc.value, sc.status, sc.notes,
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

    if (result.rows.length === 0) {
      return NextResponse.json({
        message: 'Nenhum serviço encontrado para exportar'
      }, { status: 404 });
    }

    // Gerar CSV
    const headers = [
      'Título',
      'Descrição',
      'Data Início',
      'Data Fim',
      'Cliente',
      'Projeto',
      'Status',
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

    const getStatusLabel = (status: string) => {
      const labels: { [key: string]: string } = {
        'pending': 'Pendente',
        'in_progress': 'Em Andamento',
        'completed': 'Concluído',
        'cancelled': 'Cancelado'
      };
      return labels[status] || status;
    };

    // Montar linhas do CSV
    const csvLines = [headers.join(',')];

    result.rows.forEach(service => {
      const row = [
        escapeCSV(service.title),
        escapeCSV(service.description),
        escapeCSV(formatDate(service.start_date)),
        escapeCSV(formatDate(service.end_date)),
        escapeCSV(service.client_name),
        escapeCSV(service.project_name),
        escapeCSV(getStatusLabel(service.status)),
        escapeCSV(service.value ? parseFloat(service.value).toFixed(2) : ''),
        escapeCSV(service.notes)
      ];
      csvLines.push(row.join(','));
    });

    const csvContent = csvLines.join('\n');

    // Retornar CSV com headers apropriados
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="servicos_${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });

  } catch (error: any) {
    console.error('Erro ao exportar CSV de serviços:', error);
    return NextResponse.json(
      { message: 'Erro ao exportar CSV' },
      { status: 500 }
    );
  }
}
