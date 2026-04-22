import {
  Pedido,
  ItemPedido,
  AvaliacaoPedido,
  HistoricoStatus,
  StatusPedido,
  OrigemStatus,
} from '../entities/pedido.entity'

// Filtros para listagem
export interface FiltrosPedido {
  status?: StatusPedido
  dataInicio?: Date
  dataFim?: Date
  page?: number
  limit?: number
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// Interface do repositório (Dependency Inversion — SOLID)
export interface IPedidoRepository {
  criar(pedido: Omit<Pedido, 'id' | 'criadoEm' | 'atualizadoEm'>): Promise<Pedido>
  buscarPorId(id: string): Promise<Pedido | null>
  listarPorCliente(clienteId: string, filtros: FiltrosPedido): Promise<PaginatedResult<Pedido>>
  atualizar(id: string, dados: Partial<Pedido>): Promise<Pedido>
  registrarHistorico(historico: Omit<HistoricoStatus, 'id' | 'registradoEm'>): Promise<void>
  buscarHistorico(pedidoId: string): Promise<HistoricoStatus[]>
  criarAvaliacao(avaliacao: Omit<AvaliacaoPedido, 'id' | 'criadoEm'>): Promise<AvaliacaoPedido>
  buscarAvaliacao(pedidoId: string): Promise<AvaliacaoPedido | null>
}
