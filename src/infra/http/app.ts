import Fastify, { FastifyInstance } from 'fastify'
import fastifyJwt from '@fastify/jwt'
import fastifyCors from '@fastify/cors'
import fastifyHelmet from '@fastify/helmet'
import fastifySwagger from '@fastify/swagger'
import fastifySwaggerUi from '@fastify/swagger-ui'

import prisma from '../database/prisma/prisma.client'
import { PrismaPedidoRepository } from '../database/repositories/prisma-pedido.repository'

import { CriarPedidoUseCase } from '../../application/use-cases/pedido/criar-pedido.use-case'
import {
  BuscarPedidoUseCase,
  ListarPedidosUseCase,
  ListarPedidosPorRestauranteUseCase,
  CancelarPedidoUseCase,
  AtualizarStatusPedidoUseCase,
  AplicarDescontoUseCase,
} from '../../application/use-cases/pedido/pedido.use-cases'
import { AvaliarPedidoUseCase } from '../../application/use-cases/avaliacao/avaliar-pedido.use-case'
import { PedidoController } from './controllers/pedido.controller'
import { MensagemController } from './controllers/mensagem.controller'
import { pedidoRoutes } from './routes/pedido.routes'
import { mensagemRoutes } from './routes/mensagem.routes'
import {
  EnviarMensagemUseCase,
  ListarMensagensUseCase,
  MarcarMensagensLidasUseCase,
} from '../../application/use-cases/mensagem/mensagem.use-cases'
import { AppError } from '../../domain/errors/app.error'
import { ZodError } from 'zod'

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: process.env.NODE_ENV !== 'test',
  })

  await app.register(fastifyCors, { origin: true })
  await app.register(fastifyHelmet)

  await app.register(fastifyJwt, {
    secret: process.env.JWT_SECRET!,
  })

  await app.register(fastifySwagger, {
    openapi: {
      info: {
        title: 'MS Pedidos — API',
        description: 'Microsserviço de Pedidos | Plataforma de Delivery | SENAC Rio',
        version: '1.0.0',
      },
      components: {
        securitySchemes: {
          bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        },
      },
    },
  })

  await app.register(fastifySwaggerUi, {
    routePrefix: '/docs',
    uiConfig: { docExpansion: 'list', deepLinking: false },
  })

  const repository = new PrismaPedidoRepository(prisma)

  const controller = new PedidoController(
    new CriarPedidoUseCase(repository),
    new BuscarPedidoUseCase(repository),
    new ListarPedidosUseCase(repository),
    new ListarPedidosPorRestauranteUseCase(repository),
    new CancelarPedidoUseCase(repository),
    new AtualizarStatusPedidoUseCase(repository),
    new AplicarDescontoUseCase(repository),
    new AvaliarPedidoUseCase(repository),
  )

  const mensagemController = new MensagemController(
    new EnviarMensagemUseCase(repository),
    new ListarMensagensUseCase(repository),
    new MarcarMensagensLidasUseCase(repository),
  )

  await pedidoRoutes(app, controller)
  await mensagemRoutes(app, mensagemController)

  app.get('/health', {
    schema: { tags: ['Sistema'], summary: 'Health check do serviço' },
  }, async (_, reply) => {
    try {
      await prisma.$queryRaw`SELECT 1`
      return reply.send({
        status: 'ok',
        service: 'ms-pedidos',
        database: 'connected',
        timestamp: new Date().toISOString(),
      })
    } catch {
      return reply.status(503).send({
        status: 'error',
        service: 'ms-pedidos',
        database: 'disconnected',
        timestamp: new Date().toISOString(),
      })
    }
  })

  app.setErrorHandler((error: any, request, reply) => {
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        success: false,
        code: error.code,
        message: error.message,
      })
    }

    if (error instanceof ZodError) {
      return reply.status(400).send({
        success: false,
        code: 'VALIDATION_ERROR',
        message: 'Dados inválidos.',
        errors: error.errors.map((e: any) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      })
    }

    if (error.statusCode === 401) {
      return reply.status(401).send({
        success: false,
        code: 'UNAUTHORIZED',
        message: 'Token inválido ou expirado.',
      })
    }

    app.log.error(error)
    return reply.status(500).send({
      success: false,
      code: 'INTERNAL_ERROR',
      message: 'Erro interno do servidor.',
    })
  })

  return app
}