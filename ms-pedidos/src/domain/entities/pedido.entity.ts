// Enums do domínio
export enum StatusPedido {
  AGUARDANDO_CONFIRMACAO = 'AGUARDANDO_CONFIRMACAO',
  CONFIRMADO = 'CONFIRMADO',
  EM_PREPARO = 'EM_PREPARO',
  EM_ENTREGA = 'EM_ENTREGA',
  ENTREGUE = 'ENTREGUE',
  CANCELADO = 'CANCELADO',
}

export enum FormaPagamento {
  CARTAO_CREDITO = 'CARTAO_CREDITO',
  CARTAO_DEBITO = 'CARTAO_DEBITO',
  PIX = 'PIX',
  DINHEIRO = 'DINHEIRO',
  VALE_REFEICAO = 'VALE_REFEICAO',
}

export enum OrigemStatus {
  CLIENTE = 'CLIENTE',
  PAGAMENTOS = 'PAGAMENTOS',
  ENTREGADORES = 'ENTREGADORES',
  SISTEMA = 'SISTEMA',
}

// Transições de status válidas (RN05)
const transicoesValidas: Record<StatusPedido, StatusPedido[]> = {
  [StatusPedido.AGUARDANDO_CONFIRMACAO]: [StatusPedido.CONFIRMADO, StatusPedido.CANCELADO],
  [StatusPedido.CONFIRMADO]: [StatusPedido.EM_PREPARO, StatusPedido.CANCELADO],
  [StatusPedido.EM_PREPARO]: [StatusPedido.EM_ENTREGA],
  [StatusPedido.EM_ENTREGA]: [StatusPedido.ENTREGUE],
  [StatusPedido.ENTREGUE]: [],
  [StatusPedido.CANCELADO]: [],
}

export function podeTransicionarPara(atual: StatusPedido, novo: StatusPedido): boolean {
  return transicoesValidas[atual].includes(novo)
}

// Endereço (value object)
export interface Endereco {
  rua: string
  numero: string
  complemento?: string
  bairro: string
  cidade: string
  estado: string
  cep: string
  latitude?: number
  longitude?: number
}

// Item do pedido
export interface ItemPedido {
  id?: string
  pedidoId?: string
  produtoId: string
  nomeProduto: string
  quantidade: number
  precoUnitario: number  // em centavos
  subtotal: number       // em centavos
  observacoes?: string
}

// Pedido (entidade principal)
export interface Pedido {
  id?: string
  clienteId: string
  restauranteId: string
  entregadorId?: string
  pagamentoId?: string
  status: StatusPedido
  itens: ItemPedido[]
  enderecoRua: string
  enderecoNumero: string
  enderecoComplemento?: string
  enderecoBairro: string
  enderecoCidade: string
  enderecoEstado: string
  enderecoCep: string
  enderecoLatitude?: number
  enderecoLongitude?: number
  formaPagamento: FormaPagamento
  subtotal: number     // em centavos
  taxaEntrega: number  // em centavos
  desconto: number     // em centavos — fornecido por Pagamentos
  total: number        // em centavos
  observacoes?: string
  criadoEm?: Date
  atualizadoEm?: Date
}

// Avaliação
export interface AvaliacaoPedido {
  id?: string
  pedidoId: string
  clienteId: string
  nota: number  // 1 a 5
  comentario?: string
  criadoEm?: Date
}

// Histórico de status
export interface HistoricoStatus {
  id?: string
  pedidoId: string
  statusAnterior?: StatusPedido
  statusNovo: StatusPedido
  origem: OrigemStatus
  registradoEm?: Date
}

// Helpers de cálculo (RN08)
export function calcularSubtotalItem(quantidade: number, precoUnitario: number): number {
  return quantidade * precoUnitario
}

export function calcularTotalPedido(subtotal: number, desconto: number, taxaEntrega: number): number {
  const total = subtotal - desconto + taxaEntrega
  return Math.max(0, total)
}
