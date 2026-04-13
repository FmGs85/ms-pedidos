import { z } from 'zod'

// ─── Criar Pedido ─────────────────────────────────────────────────────────────
export const criarPedidoSchema = z.object({
  restauranteId: z.string().uuid('restauranteId deve ser um UUID válido.'),
  itens: z
    .array(
      z.object({
        produtoId: z.string().uuid('produtoId deve ser um UUID válido.'),
        nomeProduto: z.string().min(1, 'Nome do produto é obrigatório.'),
        quantidade: z.number().int().min(1, 'Quantidade deve ser ao menos 1.'),
        precoUnitario: z.number().int().min(1, 'Preço unitário deve ser maior que zero.'),
        observacoes: z.string().max(255).optional(),
      }),
    )
    .min(1, 'O pedido deve ter ao menos um item.'),
  endereco: z.object({
    rua: z.string().min(1, 'Rua é obrigatória.'),
    numero: z.string().min(1, 'Número é obrigatório.'),
    complemento: z.string().max(80).optional(),
    bairro: z.string().min(1, 'Bairro é obrigatório.'),
    cidade: z.string().min(1, 'Cidade é obrigatória.'),
    estado: z.string().length(2, 'Estado deve ter 2 caracteres (ex: RJ).'),
    cep: z.string().regex(/^\d{5}-?\d{3}$/, 'CEP inválido. Use o formato 00000-000.'),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
  }),
  formaPagamento: z.enum([
    'CARTAO_CREDITO',
    'CARTAO_DEBITO',
    'PIX',
    'DINHEIRO',
    'VALE_REFEICAO',
  ]),
  taxaEntrega: z.number().int().min(0, 'Taxa de entrega não pode ser negativa.'),
  observacoes: z.string().max(1000).optional(),
})

// ─── Atualizar Status ─────────────────────────────────────────────────────────
export const atualizarStatusSchema = z.object({
  status: z.enum([
    'AGUARDANDO_CONFIRMACAO',
    'CONFIRMADO',
    'EM_PREPARO',
    'EM_ENTREGA',
    'ENTREGUE',
    'CANCELADO',
  ]),
  origem: z.enum(['CLIENTE', 'PAGAMENTOS', 'ENTREGADORES', 'SISTEMA']),
})

// ─── Avaliação ────────────────────────────────────────────────────────────────
export const avaliarPedidoSchema = z.object({
  nota: z.number().int().min(1).max(5),
  comentario: z.string().max(1000).optional(),
})

// ─── Aplicar Desconto (interno) ───────────────────────────────────────────────
export const aplicarDescontoSchema = z.object({
  pagamentoId: z.string().uuid(),
  desconto: z.number().int().min(0),
})

// ─── Filtros de listagem ──────────────────────────────────────────────────────
export const filtrosPedidoSchema = z.object({
  status: z
    .enum([
      'AGUARDANDO_CONFIRMACAO',
      'CONFIRMADO',
      'EM_PREPARO',
      'EM_ENTREGA',
      'ENTREGUE',
      'CANCELADO',
    ])
    .optional(),
  dataInicio: z.string().datetime().optional(),
  dataFim: z.string().datetime().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
})

export type CriarPedidoInput = z.infer<typeof criarPedidoSchema>
export type AtualizarStatusInput = z.infer<typeof atualizarStatusSchema>
export type AvaliarPedidoInput = z.infer<typeof avaliarPedidoSchema>
export type AplicarDescontoInput = z.infer<typeof aplicarDescontoSchema>
export type FiltrosPedidoInput = z.infer<typeof filtrosPedidoSchema>
