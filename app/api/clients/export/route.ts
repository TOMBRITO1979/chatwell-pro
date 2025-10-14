import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken, extractTokenFromHeader } from '@/lib/auth';

// GET /api/clients/export - Exportar clientes para CSV
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

    // Buscar todos os clientes do usuário
    const result = await db.query(
      `SELECT name, email, phone, whatsapp, cpf_cnpj,
              address, city, state, zip_code, notes, status
       FROM clients
       WHERE user_id = $1
       ORDER BY name ASC`,
      [payload.userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({
        message: 'Nenhum cliente encontrado para exportar'
      }, { status: 404 });
    }

    // Gerar CSV
    const headers = [
      'Nome',
      'Email',
      'Telefone',
      'WhatsApp',
      'CPF/CNPJ',
      'Endereço',
      'Cidade',
      'Estado',
      'CEP',
      'Observações',
      'Status'
    ];

    // Função auxiliar para escapar valores CSV
    const escapeCSV = (value: any): string => {
      if (value === null || value === undefined) return '';
      const stringValue = String(value);
      // Se contém vírgula, aspas ou quebra de linha, envolver em aspas
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    };

    // Montar linhas do CSV
    const csvLines = [headers.join(',')];

    result.rows.forEach(client => {
      const row = [
        escapeCSV(client.name),
        escapeCSV(client.email),
        escapeCSV(client.phone),
        escapeCSV(client.whatsapp),
        escapeCSV(client.cpf_cnpj),
        escapeCSV(client.address),
        escapeCSV(client.city),
        escapeCSV(client.state),
        escapeCSV(client.zip_code),
        escapeCSV(client.notes),
        escapeCSV(client.status)
      ];
      csvLines.push(row.join(','));
    });

    const csvContent = csvLines.join('\n');

    // Retornar CSV com headers apropriados
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="clientes_${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });

  } catch (error: any) {
    console.error('Erro ao exportar clientes:', error);
    return NextResponse.json(
      { message: 'Erro ao exportar clientes' },
      { status: 500 }
    );
  }
}
