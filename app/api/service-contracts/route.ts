import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken, extractTokenFromHeader } from '@/lib/auth';

// GET /api/service-contracts - Listar contratos de serviço
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

    // Parâmetros de busca e filtro
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('client_id') || '';
    const status = searchParams.get('status') || '';
    const inProgress = searchParams.get('in_progress') === 'true';

    // Query base com JOIN para obter dados do cliente e projeto
    let query = `
      SELECT
        sc.id, sc.client_id, sc.project_id, sc.contract_date,
        sc.delivery_date, sc.status, sc.notes, sc.tags,
        sc.created_at, sc.updated_at,
        c.name as client_name,
        p.name as project_name,
        p.service_type,
        p.image_url
      FROM service_contracts sc
      LEFT JOIN clients c ON sc.client_id = c.id
      LEFT JOIN projects p ON sc.project_id = p.id
      WHERE sc.user_id = $1
    `;
    const params: any[] = [payload.userId];
    let paramIndex = 2;

    // Filtro por cliente
    if (clientId) {
      query += ` AND sc.client_id = $${paramIndex}`;
      params.push(clientId);
      paramIndex++;
    }

    // Filtro por status
    if (status) {
      query += ` AND sc.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    // Filtro para "Em Andamento" (apenas status 'iniciado')
    if (inProgress) {
      query += ` AND sc.status = 'iniciado'`;
    }

    // Ordenação
    query += ` ORDER BY sc.created_at DESC`;

    const result = await db.query(query, params);

    return NextResponse.json({
      success: true,
      contracts: result.rows
    });

  } catch (error: any) {
    console.error('Erro ao listar contratos:', error);
    return NextResponse.json(
      { message: 'Erro ao listar contratos de serviço' },
      { status: 500 }
    );
  }
}

// POST /api/service-contracts - Criar novo contrato de serviço
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

    const body = await request.json();
    const { client_id, project_id, contract_date, delivery_date, status, notes, tags } = body;

    // Validação
    if (!client_id || !project_id || !contract_date) {
      return NextResponse.json(
        { message: 'Client ID, Project ID e Data de Contratação são obrigatórios' },
        { status: 400 }
      );
    }

    // Validar se o cliente e projeto pertencem ao usuário
    const clientCheck = await db.query(
      'SELECT id FROM clients WHERE id = $1 AND user_id = $2',
      [client_id, payload.userId]
    );

    if (clientCheck.rows.length === 0) {
      return NextResponse.json(
        { message: 'Cliente não encontrado' },
        { status: 404 }
      );
    }

    const projectCheck = await db.query(
      'SELECT id FROM projects WHERE id = $1 AND user_id = $2',
      [project_id, payload.userId]
    );

    if (projectCheck.rows.length === 0) {
      return NextResponse.json(
        { message: 'Serviço/Projeto não encontrado' },
        { status: 404 }
      );
    }

    // Inserir contrato
    const result = await db.query(
      `INSERT INTO service_contracts
        (user_id, client_id, project_id, contract_date, delivery_date, status, notes, tags)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, client_id, project_id, contract_date, delivery_date,
                 status, notes, tags, created_at`,
      [
        payload.userId,
        client_id,
        project_id,
        contract_date,
        delivery_date || null,
        status || 'em_tratativa',
        notes || null,
        tags || []
      ]
    );

    // Atualizar status do projeto
    await db.query(
      'UPDATE projects SET status = $1, updated_at = NOW() WHERE id = $2',
      [status || 'em_tratativa', project_id]
    );

    // Criar task no Kanban automaticamente
    const projectData = await db.query(
      'SELECT name FROM projects WHERE id = $1',
      [project_id]
    );

    const clientData = await db.query(
      'SELECT name FROM clients WHERE id = $1',
      [client_id]
    );

    const taskTitle = `${projectData.rows[0].name} - ${clientData.rows[0].name}`;
    const taskDescription = notes || `Contrato iniciado em ${contract_date}`;

    await db.query(
      `INSERT INTO tasks (
        user_id, client_id, project_id, title, description, due_date,
        status, priority, notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        payload.userId,
        client_id,
        project_id,
        taskTitle,
        taskDescription,
        delivery_date || null,
        status || 'em_tratativa',
        'medium',
        notes || null
      ]
    );

    return NextResponse.json({
      success: true,
      message: 'Contrato de serviço criado com sucesso!',
      contract: result.rows[0]
    }, { status: 201 });

  } catch (error: any) {
    console.error('Erro ao criar contrato:', error);
    return NextResponse.json(
      { message: 'Erro ao criar contrato de serviço' },
      { status: 500 }
    );
  }
}
