import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken, extractTokenFromHeader } from '@/lib/auth';

// GET /api/tasks/:id
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
      `SELECT t.*, c.name as client_name, p.name as project_name
       FROM tasks t
       LEFT JOIN clients c ON t.client_id = c.id
       LEFT JOIN projects p ON t.project_id = p.id
       WHERE t.id = $1 AND t.user_id = $2`,
      [params.id, payload.userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ message: 'Tarefa não encontrada' }, { status: 404 });
    }

    return NextResponse.json({ success: true, task: result.rows[0] });

  } catch (error: any) {
    console.error('Erro ao buscar tarefa:', error);
    return NextResponse.json({ message: 'Erro ao buscar tarefa' }, { status: 500 });
  }
}

// PUT /api/tasks/:id
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

    const body = await request.json();
    const {
      title, description, due_date, completed_date, status, priority,
      estimated_hours, actual_hours, tags, notes,
      client_id, project_id
    } = body;

    if (!title) {
      return NextResponse.json({
        message: 'Título da tarefa é obrigatório'
      }, { status: 400 });
    }

    const checkResult = await db.query(
      'SELECT id FROM tasks WHERE id = $1 AND user_id = $2',
      [params.id, payload.userId]
    );

    if (checkResult.rows.length === 0) {
      return NextResponse.json({ message: 'Tarefa não encontrada' }, { status: 404 });
    }

    // Se status mudou para completed, atualizar completed_date
    let finalCompletedDate = completed_date;
    if (status === 'completed' && !completed_date) {
      finalCompletedDate = new Date().toISOString();
    } else if (status !== 'completed') {
      finalCompletedDate = null;
    }

    const result = await db.query(
      `UPDATE tasks
       SET title = $1, description = $2, due_date = $3, completed_date = $4,
           status = $5, priority = $6, estimated_hours = $7, actual_hours = $8,
           tags = $9, notes = $10, client_id = $11, project_id = $12
       WHERE id = $13 AND user_id = $14
       RETURNING *`,
      [
        title, description || null, due_date || null, finalCompletedDate,
        status, priority, estimated_hours || null, actual_hours || null,
        tags || null, notes || null, client_id || null, project_id || null,
        params.id, payload.userId
      ]
    );

    return NextResponse.json({
      success: true,
      message: 'Tarefa atualizada com sucesso!',
      task: result.rows[0]
    });

  } catch (error: any) {
    console.error('Erro ao atualizar tarefa:', error);
    return NextResponse.json({ message: 'Erro ao atualizar tarefa' }, { status: 500 });
  }
}

// DELETE /api/tasks/:id
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

    const checkResult = await db.query(
      'SELECT id FROM tasks WHERE id = $1 AND user_id = $2',
      [params.id, payload.userId]
    );

    if (checkResult.rows.length === 0) {
      return NextResponse.json({ message: 'Tarefa não encontrada' }, { status: 404 });
    }

    await db.query(
      'DELETE FROM tasks WHERE id = $1 AND user_id = $2',
      [params.id, payload.userId]
    );

    return NextResponse.json({
      success: true,
      message: 'Tarefa deletada com sucesso!'
    });

  } catch (error: any) {
    console.error('Erro ao deletar tarefa:', error);
    return NextResponse.json({ message: 'Erro ao deletar tarefa' }, { status: 500 });
  }
}
