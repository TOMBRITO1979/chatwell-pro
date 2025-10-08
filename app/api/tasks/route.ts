import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken, extractTokenFromHeader } from '@/lib/auth';

// GET /api/tasks - Listar todas as tarefas do usuário
export async function GET(request: NextRequest) {
  try {
    const token = extractTokenFromHeader(request.headers.get('authorization'));
    if (!token) {
      return NextResponse.json({ message: 'Token não fornecido' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ message: 'Token inválido' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const projectId = searchParams.get('project_id');

    let query = `
      SELECT t.id, t.title, t.description, t.due_date, t.completed_date,
             t.status, t.priority, t.estimated_hours, t.actual_hours,
             t.tags, t.notes, t.created_at, t.updated_at,
             c.name as client_name, c.id as client_id,
             p.name as project_name, p.id as project_id
      FROM tasks t
      LEFT JOIN clients c ON t.client_id = c.id
      LEFT JOIN projects p ON t.project_id = p.id
      WHERE t.user_id = $1
    `;
    const params: any[] = [payload.userId];
    let paramIndex = 2;

    if (search) {
      query += ` AND (LOWER(t.title) LIKE LOWER($${paramIndex}) OR LOWER(t.description) LIKE LOWER($${paramIndex}))`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (status) {
      query += ` AND t.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (priority) {
      query += ` AND t.priority = $${paramIndex}`;
      params.push(priority);
      paramIndex++;
    }

    if (projectId) {
      query += ` AND t.project_id = $${paramIndex}`;
      params.push(projectId);
      paramIndex++;
    }

    query += ` ORDER BY
      CASE t.priority
        WHEN 'high' THEN 1
        WHEN 'medium' THEN 2
        WHEN 'low' THEN 3
      END,
      t.due_date ASC NULLS LAST,
      t.created_at DESC`;

    const result = await db.query(query, params);

    // Calcular estatísticas
    const stats = {
      total: result.rows.length,
      pending: result.rows.filter((t: any) => t.status === 'pending').length,
      in_progress: result.rows.filter((t: any) => t.status === 'in_progress').length,
      completed: result.rows.filter((t: any) => t.status === 'completed').length,
      cancelled: result.rows.filter((t: any) => t.status === 'cancelled').length,
      high_priority: result.rows.filter((t: any) => t.priority === 'high').length,
      overdue: result.rows.filter((t: any) => {
        if (t.status === 'completed' || t.status === 'cancelled') return false;
        if (!t.due_date) return false;
        return new Date(t.due_date) < new Date();
      }).length
    };

    return NextResponse.json({
      success: true,
      tasks: result.rows,
      stats
    });

  } catch (error: any) {
    console.error('Erro ao listar tarefas:', error);
    return NextResponse.json({ message: 'Erro ao listar tarefas' }, { status: 500 });
  }
}

// POST /api/tasks - Criar nova tarefa
export async function POST(request: NextRequest) {
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
      title, description, due_date, status, priority,
      estimated_hours, actual_hours, tags, notes,
      client_id, project_id
    } = body;

    if (!title) {
      return NextResponse.json({
        message: 'Título da tarefa é obrigatório'
      }, { status: 400 });
    }

    const result = await db.query(
      `INSERT INTO tasks (
        user_id, client_id, project_id, title, description, due_date,
        status, priority, estimated_hours, actual_hours, tags, notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING id, title, description, due_date, status, priority,
                estimated_hours, created_at`,
      [
        payload.userId, client_id || null, project_id || null,
        title, description || null, due_date || null,
        status || 'pending', priority || 'medium',
        estimated_hours || null, actual_hours || null,
        tags || null, notes || null
      ]
    );

    return NextResponse.json({
      success: true,
      message: 'Tarefa criada com sucesso!',
      task: result.rows[0]
    }, { status: 201 });

  } catch (error: any) {
    console.error('Erro ao criar tarefa:', error);
    return NextResponse.json({ message: 'Erro ao criar tarefa' }, { status: 500 });
  }
}
