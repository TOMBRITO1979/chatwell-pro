import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';
const JWT_EXPIRES_IN = '24h'; // Token de super admin expira em 24 horas

// Interface para payload do JWT do super admin
export interface SuperAdminJWTPayload {
  adminId: string;
  username: string;
  email: string;
  isSuperAdmin: true;
}

// Gerar JWT para super admin
export function generateSuperAdminToken(payload: Omit<SuperAdminJWTPayload, 'isSuperAdmin'>): string {
  return jwt.sign(
    { ...payload, isSuperAdmin: true },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

// Verificar e decodificar JWT de super admin
export function verifySuperAdminToken(token: string): SuperAdminJWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as SuperAdminJWTPayload;

    // Verifica se é realmente um token de super admin
    if (!decoded.isSuperAdmin) {
      return null;
    }

    return decoded;
  } catch (error) {
    console.error('Super Admin JWT verification failed:', error);
    return null;
  }
}

// Extrair token do header Authorization
export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7); // Remove "Bearer "
}
