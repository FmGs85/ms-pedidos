import { FastifyInstance } from 'fastify'
import { PedidoController } from '../controllers/pedido.controller'
import { autenticar, apenasAdmin } from '../middlewares/auth.middleware'

export async function pedidoRoutes(
  fastify: FastifyInstance,
  controller: PedidoController,
): Promise<void> {

  // POST /pedidos — criar pedido (cliente autenticado)
  fastify.post(
    '/pedidos',
    {
      preHandler: [autenticar],
      schema: {
        tags: ['Pedidos'],
        summary: 'Criar novo pedido',
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          required: ['restauranteId', 'itens', 'enderecoRua', 'enderecoNumero',
            'enderecoBairro', 'enderecoCidade', 'enderecoEstado', 'enderecoCep',
            'formaPagamento', 'taxaEntrega'],
          properties: {
            restauranteId: { type: 'string', format: 'uuid' },
            itens: {
              type: 'array',
              items: {
                type: 'object',
                required: ['produtoId', 'nomeProduto', 'quantidade', 'precoUnitario'],
                properties: {
                  produtoId: { type: 'string', format: 'uuid' },
                  nomeProduto: { type: 'string' },
                  quantidade: { type: 'integer', minimum: 1 },
                  precoUnitario: { type: 'integer', minimum: 1, description: 'Valor em centavos' },
                  observacoes: { type: 'string' },
                },
              },
            },
            enderecoRua: { type: 'string' },
            enderecoNumero: { type: 'string' },
            enderecoComplemento: { type: 'string' },
            enderecoBairro: { type: 'string' },
            enderecoCidade: { type: 'string' },
            enderecoEstado: { type: 'string', minLength: 2, maxLength: 2 },
            enderecoCep: { type: 'string', pattern: '^\\d{5}-?\\d{3}$' },
            formaPagamento: { type: 'string', enum: ['CARTAO_CREDITO', 'CARTAO_DEBITO', 'PIX', 'DINHEIRO', 'VALE_REFEICAO'] },
            taxaEntrega: { type: 'integer', minimum: 0, description: 'Valor em centavos' },
            observacoes: { type: 'string' },
          },
        },
      },
    },
    controller.criar.bind(controller),
  )

  // GET /pedidos — histórico do cliente autenticado
  fastify.get(
    '/pedidos',
    {
      preHandler: [autenticar],
      schema: {
        tags: ['Pedidos'],
        summary: 'Listar histórico de pedidos do cliente',
        security: [{ bearerAuth: [] }],
        querystring: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['AGUARDANDO_CONFIRMACAO', 'CONFIRMADO', 'EM_PREPARO', 'EM_ENTREGA', 'ENTREGUE', 'CANCELADO'] },
            dataInicio: { type: 'string', format: 'date-time' },
            dataFim: { type: 'string', format: 'date-time' },
            page: { type: 'integer', minimum: 1, default: 1 },
            limit: { type: 'integer', minimum: 1, maximum: 50, default: 10 },
          },
        },
      },
    },
    controller.listar.bind(controller),
  )

  // GET /pedidos/:id — detalhe do pedido
  fastify.get(
    '/pedidos/:id',
    {
      preHandler: [autenticar],
      schema: {
        tags: ['Pedidos'],
        summary: 'Buscar pedido por ID',
        security: [{ bearerAuth: [] }],
        params: { type: 'object', properties: { id: { type: 'string', format: 'uuid' } } },
      },
    },
    controller.buscar.bind(controller),
  )

  // DELETE /pedidos/:id — cancelar pedido
  fastify.delete(
    '/pedidos/:id',
    {
      preHandler: [autenticar],
      schema: {
        tags: ['Pedidos'],
        summary: 'Cancelar pedido (apenas em AGUARDANDO_CONFIRMACAO)',
        security: [{ bearerAuth: [] }],
        params: { type: 'object', properties: { id: { type: 'string', format: 'uuid' } } },
      },
    },
    controller.cancelar.bind(controller),
  )

  // PATCH /pedidos/:id/status — atualizar status (admin ou microsserviços internos)
  fastify.patch(
    '/pedidos/:id/status',
    {
      preHandler: [apenasAdmin],
      schema: {
        tags: ['Pedidos'],
        summary: 'Atualizar status do pedido (admin/microsserviços)',
        security: [{ bearerAuth: [] }],
        params: { type: 'object', properties: { id: { type: 'string', format: 'uuid' } } },
        body: {
          type: 'object',
          required: ['status', 'origem'],
          properties: {
            status: { type: 'string', enum: ['AGUARDANDO_CONFIRMACAO', 'CONFIRMADO', 'EM_PREPARO', 'EM_ENTREGA', 'ENTREGUE', 'CANCELADO'] },
            origem: { type: 'string', enum: ['CLIENTE', 'PAGAMENTOS', 'ENTREGADORES', 'SISTEMA'] },
          },
        },
      },
    },
    controller.atualizarStatusHandler.bind(controller),
  )

  // POST /pedidos/:id/desconto — rota interna (MS Pagamentos)
  fastify.post(
    '/pedidos/:id/desconto',
    {
      preHandler: [apenasAdmin],
      schema: {
        tags: ['Interno'],
        summary: 'Aplicar desconto (chamado pelo MS Pagamentos)',
        security: [{ bearerAuth: [] }],
        params: { type: 'object', properties: { id: { type: 'string', format: 'uuid' } } },
        body: {
          type: 'object',
          required: ['pagamentoId', 'desconto'],
          properties: {
            pagamentoId: { type: 'string', format: 'uuid' },
            desconto: { type: 'integer', minimum: 0, description: 'Valor em centavos' },
          },
        },
      },
    },
    controller.aplicarDescontoHandler.bind(controller),
  )

  // POST /pedidos/:id/avaliacao — avaliar pedido entregue
  fastify.post(
    '/pedidos/:id/avaliacao',
    {
      preHandler: [autenticar],
      schema: {
        tags: ['Pedidos'],
        summary: 'Avaliar pedido (apenas após ENTREGUE)',
        security: [{ bearerAuth: [] }],
        params: { type: 'object', properties: { id: { type: 'string', format: 'uuid' } } },
        body: {
          type: 'object',
          required: ['nota'],
          properties: {
            nota: { type: 'integer', minimum: 1, maximum: 5 },
            comentario: { type: 'string', maxLength: 1000 },
          },
        },
      },
    },
    controller.avaliar.bind(controller),
  )
}
