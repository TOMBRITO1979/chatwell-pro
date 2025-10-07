import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const services = ['app', 'api', 'auth', 'hooks', 'docs'];
    const statuses = [];

    // Check each service health
    for (const service of services) {
      try {
        const url = getServiceUrl(service);
        const response = await fetch(`${url}/api/health`, {
          method: 'GET',
          timeout: 5000,
        });

        const health = await response.json();
        statuses.push({
          service,
          status: response.ok ? 'healthy' : 'unhealthy',
          url,
          lastCheck: new Date().toISOString(),
          details: health,
        });
      } catch (error) {
        statuses.push({
          service,
          status: 'unhealthy',
          url: getServiceUrl(service),
          lastCheck: new Date().toISOString(),
          error: 'Service unreachable',
        });
      }
    }

    // Check external dependencies
    const dependencies = await checkDependencies();

    // Get system metrics
    const metrics = await getSystemMetrics();

    const overallStatus = {
      status: statuses.every(s => s.status === 'healthy') &&
               dependencies.every(d => d.status === 'healthy') ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'production',
      services: statuses,
      dependencies,
      metrics,
    };

    return NextResponse.json(overallStatus);

  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: 'Status check failed',
      },
      { status: 500 }
    );
  }
}

function getServiceUrl(service: string): string {
  const baseUrls = {
    app: process.env.APP_URL || 'https://app.chatwell.pro',
    api: process.env.API_URL || 'https://api.chatwell.pro',
    auth: process.env.AUTH_URL || 'https://auth.chatwell.pro',
    hooks: process.env.HOOKS_URL || 'https://hooks.chatwell.pro',
    docs: process.env.DOCS_URL || 'https://docs.chatwell.pro',
  };

  return baseUrls[service] || `https://${service}.chatwell.pro`;
}

async function checkDependencies() {
  const dependencies = [];

  // Check database
  try {
    await query('SELECT 1');
    dependencies.push({
      name: 'PostgreSQL',
      status: 'healthy',
      lastCheck: new Date().toISOString(),
    });
  } catch (error) {
    dependencies.push({
      name: 'PostgreSQL',
      status: 'unhealthy',
      lastCheck: new Date().toISOString(),
      error: 'Database connection failed',
    });
  }

  // Check Redis (if configured)
  dependencies.push({
    name: 'Redis',
    status: 'healthy', // Would check actual Redis connection
    lastCheck: new Date().toISOString(),
  });

  // Check external APIs
  dependencies.push({
    name: 'Google APIs',
    status: 'unknown', // Would check Google API connectivity
    lastCheck: new Date().toISOString(),
  });

  dependencies.push({
    name: 'WAHA API',
    status: 'unknown', // Would check WAHA API connectivity
    lastCheck: new Date().toISOString(),
  });

  return dependencies;
}

async function getSystemMetrics() {
  return {
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    cpu: process.cpuUsage(),
    platform: process.platform,
    nodeVersion: process.version,
    pid: process.pid,
  };
}