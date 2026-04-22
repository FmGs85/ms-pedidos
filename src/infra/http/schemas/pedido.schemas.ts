import { z } from 'zod'
import { StatusPedido, FormaPagamento } from '../../../domain/entities/pedido.entity'

// ─── Schemas de entrada (Zod) ──────────────────────────────────────────────────

export const criarPedidoSchema = z.object({
  restauranteId: z.string().uuid('restauranteId deve ser UUID válido'),
  itens: z
    .array(
      z.object({
        produtoId: z.string().uuid('produtoId deve ser UUID válido'),
        nomeProduto: z.string().min(1, 'Nome do produto é obrigatório'),
        quantidade: z.number().int().positive('Quantidade deve ser positiva'),
        precoUnitario: z.number().int().nonnegative('Preço não pode ser negativo'),
        observacoes: z.string().optional(),
      }),
    )
    .min(1, 'O pedido deve conter pelo menos um item'),
  endereco: z.object({
    rua: z.string().min(1, 'Rua é obrigatória'),
    numero: z.string().min(1, 'Número é obrigatório'),
    complemento: z.string().optional(),
    bairro: z.string().min(1, 'Bairro é obrigatório'),
    cidade: z.string().min(1, 'Cidade é obrigatória'),
    estado: z.string().length(2, 'Estado deve ter 2 caracteres (UF)'),
    cep: z.string().regex(/^\d{5}-?\d{3}$/, 'CEP deve ter formato 00000-000 ou 00000000'),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
  }),
  formaPagamento: z.nativeEnum(FormaPagamento, {
    errorMap: () => ({ message: 'Forma de pagamento inválida' }),
  }),
  taxaEntrega: z.number().int().nonnegative('Taxa de entrega não pode ser negativa'),
  observacoes: z.string().optional(),
})

export const atualizarStatusSchema = z.object({
  status: z.nativeEnum(StatusPedido, {
    errorMap: () => ({ message: 'Status inválido' }),
  }),
  origem: z.string().optional(),
  entregadorId: z.string().uuid().optional(),
})

export const avaliarPedidoSchema = z.object({
  nota: z.number().int().min(1, 'Nota mínima é 1').max(5, 'Nota máxima é 5'),
  comentario: z.string().max(500, 'Comentário deve ter no máximo 500 caracteres').optional(),
})

export const aplicarDescontoSchema = z.object({
  desconto: z.number().int().nonnegative('Desconto não pode ser negativo'),
})

export const filtrosPedidoSchema = z.object({
  status: z.nativeEnum(StatusPedido).optional(),
  dataInicio: z.string().datetime().optional(),
  dataFim: z.string().datetime().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(10),
})

// ─── Tipos inferidos ───────────────────────────────────────────────────────────

export type CriarPedidoBody = z.infer<typeof criarPedidoSchema>
export type AtualizarStatusBody = z.infer<typeof atualizarStatusSchema>
export type AvaliarPedidoBody = z.infer<typeof avaliarPedidoSchema>
export type AplicarDescontoBody = z.infer<typeof aplicarDescontoSchema>
export type FiltrosPedidoQuery = z.infer<typeof filtrosPedidoSchema>

// ─── Schemas Swagger (JSON Schema para documentação) ───────────────────────────

export const swaggerSchemas = {
  criarPedido: {
    tags: ['Pedidos'],
    summary: 'Criar novo pedido',
    security: [{ bearerAuth: [] }],
    body: {
      type: 'object',
      required: ['restauranteId', 'itens', 'endereco', 'formaPagamento', 'taxaEntrega'],
      properties: {
        restauranteId: { type: 'string', format: 'uuid' },
        itens: {
          type: 'array',
          minItems: 1,
          items: {
            type: 'object',
            required: ['produtoId', 'nomeProduto', 'quantidade', 'precoUnitario'],
            properties: {
              produtoId: { type: 'string', format: 'uuid' },
              nomeProduto: { type: 'string' },
              quantidade: { type: 'integer', minimum: 1 },
              precoUnitario: { type: 'integer', minimum: 0, description: 'Valor em centavos' },
              observacoes: { type: 'string' },
            },
          },
        },
        endereco: {
          type: 'object',
          required: ['rua', 'numero', 'bairro', 'cidade', 'estado', 'cep'],
          properties: {
            rua: { type: 'string' },
            numero: { type: 'string' },
            complemento: { type: 'string' },
            bairro: { type: 'string' },
            cidade: { type: 'string' },
            estado: { type: 'string', minLength: 2, maxLength: 2 },
            cep: { type: 'string', pattern: '^\\d{5}-?\\d{3}$' },
            latitude: { type: 'number' },
            longitude: { type: 'number' },
          },
        },
        formaPagamento: { type: 'string', enum: Object.values(FormaPagamento) },
        taxaEntrega: { type: 'integer', minimum: 0, description: 'Valor em centavos' },
        observacoes: { type: 'string' },
      },
    },
  },

  listarPedidos: {
    tags: ['Pedidos'],
    summary: 'Listar pedidos do cliente autenticado',
    security: [{ bearerAuth: [] }],
    querystring: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: Object.values(StatusPedido) },
        dataInicio: { type: 'string', format: 'date-time' },
        dataFim: { type: 'string', format: 'date-time' },
        page: { type: 'integer', default: 1 },
        limit: { type: 'integer', default: 10, maximum: 50 },
      },
    },
  },

  buscarPedido: {
    tags: ['Pedidos'],
    summary: 'Buscar pedido por ID',
    security: [{ bearerAuth: [] }],
    params: {
      type: 'object',
      properties: { id: { type: 'string', format: 'uuid' } },
    },
  },

  cancelarPedido: {
    tags: ['Pedidos'],
    summary: 'Cancelar pedido',
    security: [{ bearerAuth: [] }],
    params: {
      type: 'object',
      properties: { id: { type: 'string', format: 'uuid' } },
    },
  },

  atualizarStatus: {
    tags: ['Pedidos'],
    summary: 'Atualizar status do pedido (Admin)',
    security: [{ bearerAuth: [] }],
    params: {
      type: 'object',
      properties: { id: { type: 'string', format: 'uuid' } },
    },
    body: {
      type: 'object',
      required: ['status'],
      properties: {
        status: { type: 'string', enum: Object.values(StatusPedido) },
        origem: { type: 'string' },
        entregadorId: { type: 'string', format: 'uuid' },
      },
    },
  },

  avaliarPedido: {
    tags: ['Pedidos'],
    summary: 'Avaliar pedido entregue',
    security: [{ bearerAuth: [] }],
    params: {
      type: 'object',
      properties: { id: { type: 'string', format: 'uuid' } },
    },
    body: {
      type: 'object',
      required: ['nota'],
      properties: {
        nota: { type: 'integer', minimum: 1, maximum: 5 },
        comentario: { type: 'string', maxLength: 500 },
      },
    },
  },

  aplicarDesconto: {
    tags: ['Pedidos'],
    summary: 'Aplicar desconto ao pedido (interno)',
    security: [{ bearerAuth: [] }],
    params: {
      type: 'object',
      properties: { id: { type: 'string', format: 'uuid' } },
    },
    body: {
      type: 'object',
      required: ['desconto'],
      properties: {
        desconto: { type: 'integer', minimum: 0, description: 'Valor em centavos' },
      },
    },
  },
}
