import { Pedido, StatusPedido, FormaPagamento } from '../../src/domain/entities/pedido.entity'

/**
 * Factory para criar pedidos nos testes.
 * Preenche todos os campos obrigatórios com valores padrão
 * e permite override parcial via parâmetro.
 */
export function makePedido(overrides: Partial<Pedido> = {}): Pedido {
  return {
    id: 'uuid-pedido-1',
    clienteId: 'uuid-cliente-1',
    restauranteId: 'uuid-restaurante-1',
    status: StatusPedido.AGUARDANDO_CONFIRMACAO,
    itens: [
      {
        produtoId: 'uuid-prod-1',
        nomeProduto: 'Pizza Margherita',
        quantidade: 1,
        precoUnitario: 4500,
        subtotal: 4500,
      },
    ],
    endereco: {
      rua: 'Rua A',
      numero: '10',
      bairro: 'Centro',
      cidade: 'Rio de Janeiro',
      estado: 'RJ',
      cep: '20000-000',
    },
    formaPagamento: FormaPagamento.PIX,
    subtotal: 4500,
    taxaEntrega: 500,
    desconto: 0,
    total: 5000,
    criadoEm: new Date('2025-06-01T12:00:00Z'),
    atualizadoEm: new Date('2025-06-01T12:00:00Z'),
    ...overrides,
  }
}
