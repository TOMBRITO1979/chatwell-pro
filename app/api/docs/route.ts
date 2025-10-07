import { NextResponse } from 'next/server';

export async function GET() {
  const openApiSpec = {
    openapi: '3.0.0',
    info: {
      title: 'Chatwell Pro API',
      version: '1.0.0',
      description: 'Sistema completo de gestão empresarial com agenda, clientes, projetos e finanças',
      contact: {
        name: 'Chatwell Pro Support',
        url: 'https://chatwell.pro',
        email: 'support@chatwell.pro',
      },
    },
    servers: [
      {
        url: 'https://api.chatwell.pro',
        description: 'Production API',
      },
      {
        url: 'https://hooks.chatwell.pro',
        description: 'Webhook endpoints',
      },
      {
        url: 'https://auth.chatwell.pro',
        description: 'Authentication endpoints',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            email: { type: 'string', format: 'email' },
            role: { type: 'string', enum: ['owner', 'admin', 'member'] },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        Customer: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            display_name: { type: 'string' },
            first_name: { type: 'string' },
            last_name: { type: 'string' },
            email: { type: 'string', format: 'email' },
            phone: { type: 'string' },
            company: { type: 'string' },
            ltv_amount_cents: { type: 'integer' },
            ltv_count: { type: 'integer' },
          },
        },
        Appointment: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            title: { type: 'string' },
            starts_at: { type: 'string', format: 'date-time' },
            ends_at: { type: 'string', format: 'date-time' },
            location: { type: 'string' },
            description: { type: 'string' },
            confirmation_code: { type: 'string' },
          },
        },
        Project: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            budget_cents: { type: 'integer' },
            status: {
              type: 'string',
              enum: ['planejando', 'iniciando', 'pendente', 'em_andamento', 'concluido']
            },
            due_date: { type: 'string', format: 'date' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' },
            code: { type: 'string' },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    paths: {
      '/api/health': {
        get: {
          summary: 'Health check endpoint',
          tags: ['System'],
          security: [],
          responses: {
            200: {
              description: 'Service is healthy',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'string' },
                      timestamp: { type: 'string' },
                      service: { type: 'string' },
                      uptime: { type: 'number' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/auth/login': {
        post: {
          summary: 'User login',
          tags: ['Authentication'],
          security: [],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string' },
                  },
                  required: ['email', 'password'],
                },
              },
            },
          },
          responses: {
            200: {
              description: 'Login successful',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      user: { $ref: '#/components/schemas/User' },
                      accessToken: { type: 'string' },
                      refreshToken: { type: 'string' },
                    },
                  },
                },
              },
            },
            401: {
              description: 'Invalid credentials',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
          },
        },
      },
      '/api/auth/register': {
        post: {
          summary: 'User registration',
          tags: ['Authentication'],
          security: [],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    email: { type: 'string', format: 'email' },
                    phone: { type: 'string' },
                    password: { type: 'string' },
                  },
                  required: ['name', 'email', 'password'],
                },
              },
            },
          },
          responses: {
            201: {
              description: 'User created successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      user: { $ref: '#/components/schemas/User' },
                      message: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/webhooks/waha': {
        post: {
          summary: 'WAHA WhatsApp webhook',
          tags: ['Webhooks'],
          security: [
            {
              bearerAuth: [],
            },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    event: { type: 'string' },
                    data: { type: 'object' },
                    timestamp: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: 'Webhook processed successfully',
            },
          },
        },
      },
    },
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and registration',
      },
      {
        name: 'System',
        description: 'System health and monitoring',
      },
      {
        name: 'Webhooks',
        description: 'External webhook endpoints',
      },
      {
        name: 'Customers',
        description: 'Customer management',
      },
      {
        name: 'Projects',
        description: 'Project management',
      },
      {
        name: 'Appointments',
        description: 'Calendar and appointments',
      },
    ],
  };

  return NextResponse.json(openApiSpec);
}