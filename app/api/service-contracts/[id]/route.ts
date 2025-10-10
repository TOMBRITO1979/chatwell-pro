import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken, extractTokenFromHeader } from '@/lib/auth';

// GET /api/service-contracts/[id] - Buscar contrato específico
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = extractTokenFromHeader(request.headers.get('authorization'));
    if (!token) {
      return NextResponse.json({ message: 'Token não fornecido' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ message: 'Token inválido' }, { status: 401 });
    }

    const result = await db.query(
      `SELECT
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
      WHERE sc.id = $1 AND sc.user_id = $2`,
      [params.id, payload.userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { message: 'Contrato não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      contract: result.rows[0]
    });

  } catch (error: any) {
    console.error('Erro ao buscar contrato:', error);
    return NextResponse.json(
      { message: 'Erro ao buscar contrato' },
      { status: 500 }
    );
  }
}

// PUT /api/service-contracts/[id] - Atualizar contrato
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = extractTokenFromHeader(request.headers.get('authorization'));
    if (!token) {
      return NextResponse.json({ message: 'Token não fornecido' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ message: 'Token inválido' }, { status: 401 });
    }

    // Verificar se o contrato existe e pertence ao usuário
    const existingContract = await db.query(
      'SELECT * FROM service_contracts WHERE id = $1 AND user_id = $2',
      [params.id, payload.userId]
    );

    if (existingContract.rows.length === 0) {
      return NextResponse.json(
        { message: 'Contrato não encontrado' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { project_id, contract_date, delivery_date, status, notes, tags } = body;

    // Atualizar contrato
    const result = await db.query(
      `UPDATE service_contracts
       SET project_id = COALESCE($1, project_id),
           contract_date = COALESCE($2, contract_date),
           delivery_date = $3,
           status = COALESCE($4, status),
           notes = $5,
           tags = COALESCE($6, tags),
           updated_at = NOW()
       WHERE id = $7 AND user_id = $8
       RETURNING *`,
      [
        project_id,
        contract_date,
        delivery_date,
        status,
        notes,
        tags,
        params.id,
        payload.userId
      ]
    );

    // Atualizar status do projeto se o status foi alterado
    if (status) {
      await db.query(
        'UPDATE projects SET status = $1, updated_at = NOW() WHERE id = $2',
        [status, result.rows[0].project_id]
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Contrato atualizado com sucesso!',
      contract: result.rows[0]
    });

  } catch (error: any) {
    console.error('Erro ao atualizar contrato:', error);
    return NextResponse.json(
      { message: 'Erro ao atualizar contrato' },
      { status: 500 }
    );
  }
}

// DELETE /api/service-contracts/[id] - Deletar contrato
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = extractTokenFromHeader(request.headers.get('authorization'));
    if (!token) {
      return NextResponse.json({ message: 'Token não fornecido' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ message: 'Token inválido' }, { status: 401 });
    }

    // Verificar se o contrato existe e pertence ao usuário
    const existingContract = await db.query(
      'SELECT * FROM service_contracts WHERE id = $1 AND user_id = $2',
      [params.id, payload.userId]
    );

    if (existingContract.rows.length === 0) {
      return NextResponse.json(
        { message: 'Contrato não encontrado' },
        { status: 404 }
      );
    }

    // Deletar contrato
    await db.query(
      'DELETE FROM service_contracts WHERE id = $1 AND user_id = $2',
      [params.id, payload.userId]
    );

    return NextResponse.json({
      success: true,
      message: 'Contrato deletado com sucesso!'
    });

  } catch (error: any) {
    console.error('Erro ao deletar contrato:', error);
    return NextResponse.json(
      { message: 'Erro ao deletar contrato' },
      { status: 500 }
    );
  }
}
