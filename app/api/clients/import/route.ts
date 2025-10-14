import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken, extractTokenFromHeader } from '@/lib/auth';

// POST /api/clients/import - Importar clientes de CSV
export async function POST(request: NextRequest) {
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

    // Obter o arquivo CSV do body
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ message: 'Arquivo não fornecido' }, { status: 400 });
    }

    // Verificar se é um arquivo CSV
    if (!file.name.endsWith('.csv')) {
      return NextResponse.json({ message: 'O arquivo deve ser um CSV' }, { status: 400 });
    }

    // Ler conteúdo do arquivo
    const content = await file.text();
    const lines = content.split('\n').filter(line => line.trim());

    if (lines.length < 2) {
      return NextResponse.json({
        message: 'Arquivo CSV vazio ou inválido'
      }, { status: 400 });
    }

    // Parse do CSV
    const parseCSVLine = (line: string): string[] => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];

        if (char === '"') {
          if (inQuotes && nextChar === '"') {
            current += '"';
            i++; // Skip next quote
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };

    // Ignorar primeira linha (cabeçalho)
    const dataLines = lines.slice(1);

    const imported: any[] = [];
    const errors: any[] = [];

    // Processar cada linha
    for (let i = 0; i < dataLines.length; i++) {
      const lineNumber = i + 2; // +2 porque pulamos cabeçalho e arrays começam em 0
      const line = dataLines[i].trim();

      if (!line) continue;

      try {
        const columns = parseCSVLine(line);

        // Mapear colunas (baseado na ordem do export)
        const [name, email, phone, whatsapp, cpf_cnpj, address, city, state, zip_code, notes, status] = columns;

        // Validação básica
        if (!name || name.trim() === '') {
          errors.push({
            line: lineNumber,
            error: 'Nome é obrigatório',
            data: line
          });
          continue;
        }

        // Validar email se fornecido
        if (email && email.trim() !== '') {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(email)) {
            errors.push({
              line: lineNumber,
              error: 'Email inválido',
              data: line
            });
            continue;
          }
        }

        // Inserir no banco
        const result = await db.query(
          `INSERT INTO clients (user_id, name, email, phone, whatsapp, cpf_cnpj,
                                address, city, state, zip_code, notes, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
           RETURNING id, name, email`,
          [
            payload.userId,
            name.trim(),
            email?.trim() || null,
            phone?.trim() || null,
            whatsapp?.trim() || null,
            cpf_cnpj?.trim() || null,
            address?.trim() || null,
            city?.trim() || null,
            state?.trim() || null,
            zip_code?.trim() || null,
            notes?.trim() || null,
            status?.trim() || 'active'
          ]
        );

        imported.push(result.rows[0]);

      } catch (error: any) {
        errors.push({
          line: lineNumber,
          error: error.message || 'Erro ao processar linha',
          data: line
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Importação concluída! ${imported.length} cliente(s) importado(s), ${errors.length} erro(s)`,
      summary: {
        total: dataLines.length,
        imported: imported.length,
        errors: errors.length
      },
      imported,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error: any) {
    console.error('Erro ao importar clientes:', error);
    return NextResponse.json(
      { message: 'Erro ao importar clientes: ' + error.message },
      { status: 500 }
    );
  }
}
