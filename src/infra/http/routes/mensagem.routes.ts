import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { MensagemController } from '../controllers/mensagem.controller'
import { autenticar, apenasRestaurante } from '../middlewares/auth.middleware'

export async function mensagemRoutes(
  fastify: FastifyInstance,
  controller: MensagemController,
): Promise<void> {

  // POST /pedidos/:id/mensagens — apenas restaurante envia
  fastify.post('/pedidos/:id/mensagens', {
    preHandler: [apenasRestaurante],
    schema: {
      tags: ['Mensagens'],
      summary: 'Enviar mensagem ao cliente sobre um pedido (apenas restaurante)',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: { id: { type: 'string', format: 'uuid' } },
      },
      body: {
        type: 'object',
        required: ['texto'],
        properties: {
          texto: { type: 'string', minLength: 1, maxLength: 2000 },
        },
      },
      response: {
        201: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                id:          { type: 'string' },
                pedidoId:    { type: 'string' },
                remetenteId: { type: 'string' },
                texto:       { type: 'string' },
                lida:        { type: 'boolean' },
                criadoEm:    { type: 'string', format: 'date-time' },
              },
            },
          },
        },
      },
    },
  }, (req: FastifyRequest, rep: FastifyReply) => controller.enviar(req as any, rep))

  // GET /pedidos/:id/mensagens — cliente ou restaurante lista
  fastify.get('/pedidos/:id/mensagens', {
    preHandler: [autenticar],
    schema: {
      tags: ['Mensagens'],
      summary: 'Listar mensagens de um pedido',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: { id: { type: 'string', format: 'uuid' } },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id:          { type: 'string' },
                  pedidoId:    { type: 'string' },
                  remetenteId: { type: 'string' },
                  texto:       { type: 'string' },
                  lida:        { type: 'boolean' },
                  criadoEm:    { type: 'string', format: 'date-time' },
                },
              },
            },
          },
        },
      },
    },
  }, (req: FastifyRequest, rep: FastifyReply) => controller.listar(req as any, rep))

  // PATCH /pedidos/:id/mensagens/lidas — apenas cliente marca como lidas
  fastify.patch('/pedidos/:id/mensagens/lidas', {
    preHandler: [autenticar],
    schema: {
      tags: ['Mensagens'],
      summary: 'Marcar todas as mensagens do pedido como lidas (cliente)',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: { id: { type: 'string', format: 'uuid' } },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
          },
        },
      },
    },
  }, (req: FastifyRequest, rep: FastifyReply) => controller.marcarComoLidas(req as any, rep))
}
