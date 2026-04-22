import { FastifyRequest, FastifyReply } from 'fastify'
import { UnauthorizedError, ForbiddenError } from '../../../domain/errors/app.error'

export interface JwtPayload {
  sub: string        // clienteId
  email: string
  role: 'CLIENTE' | 'ADMIN'
  iat: number
  exp: number
}

// Middleware: verifica se está autenticado
export async function autenticar(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  try {
    await request.jwtVerify()
  } catch {
    throw new UnauthorizedError('Token inválido ou expirado.')
  }
}

// Middleware: verifica se é admin
export async function apenasAdmin(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  await autenticar(request, reply)
  const user = request.user as JwtPayload
  if (user.role !== 'ADMIN') {
    throw new ForbiddenError('Acesso restrito a administradores.')
  }
}

// Helper para pegar o usuário autenticado
export function getAuthUser(request: FastifyRequest): JwtPayload {
  return request.user as JwtPayload
}
