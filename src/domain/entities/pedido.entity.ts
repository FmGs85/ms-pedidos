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

export function statusPermitidos(atual: StatusPedido): StatusPedido[] {
  return transicoesValidas[atual]
}

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

export interface ItemPedido {
  id?: string
  pedidoId?: string
  produtoId: string
  nomeProduto: string
  quantidade: number
  precoUnitario: number
  subtotal: number
  observacoes?: string
}

export interface Pedido {
  id?: string
  clienteId: string
  restauranteId: string
  entregadorId?: string
  pagamentoId?: string
  status: StatusPedido
  itens: ItemPedido[]
  avaliacao?: AvaliacaoPedido
  endereco: Endereco
  formaPagamento: FormaPagamento
  subtotal: number
  taxaEntrega: number
  desconto: number
  total: number
  observacoes?: string
  criadoEm?: Date
  atualizadoEm?: Date
}

export interface MensagemPedido {
  id?: string
  pedidoId: string
  remetenteId: string
  texto: string
  lida: boolean
  criadoEm?: Date
}

export interface AvaliacaoPedido {
  id?: string
  pedidoId: string
  clienteId: string
  nota: number
  comentario?: string
  criadoEm?: Date
}

export interface HistoricoStatus {
  id?: string
  pedidoId: string
  statusAnterior?: StatusPedido
  statusNovo: StatusPedido
  origem: OrigemStatus
  registradoEm?: Date
}

export function calcularSubtotalItem(quantidade: number, precoUnitario: number): number {
  return quantidade * precoUnitario
}

export function calcularTotalPedido(subtotal: number, desconto: number, taxaEntrega: number): number {
  return Math.max(0, subtotal - desconto + taxaEntrega)
}