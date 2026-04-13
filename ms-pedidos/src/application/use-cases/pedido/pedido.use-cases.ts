import { IPedidoRepository, FiltrosPedido, PaginatedResult } from '../../../domain/interfaces/pedido.repository.interface'
import { Pedido, StatusPedido, OrigemStatus, podeTransicionarPara, calcularTotalPedido } from '../../../domain/entities/pedido.entity'
import { NotFoundError, ForbiddenError, BusinessError } from '../../../domain/errors/app.error'

// ─── Buscar Pedido ────────────────────────────────────────────────────────────
export class BuscarPedidoUseCase {
  constructor(private readonly pedidoRepository: IPedidoRepository) {}

  async execute(id: string, clienteId: string, isAdmin: boolean): Promise<Pedido> {
    const pedido = await this.pedidoRepository.buscarPorId(id)

    if (!pedido) throw new NotFoundError('Pedido')

    // RN11 — cliente só vê seus próprios pedidos
    if (!isAdmin && pedido.clienteId !== clienteId) {
      throw new ForbiddenError('Você não tem permissão para acessar este pedido.')
    }

    return pedido
  }
}

// ─── Listar Pedidos do Cliente ────────────────────────────────────────────────
export class ListarPedidosUseCase {
  constructor(private readonly pedidoRepository: IPedidoRepository) {}

  async execute(clienteId: string, filtros: FiltrosPedido): Promise<PaginatedResult<Pedido>> {
    return this.pedidoRepository.listarPorCliente(clienteId, filtros)
  }
}

// ─── Cancelar Pedido ──────────────────────────────────────────────────────────
export class CancelarPedidoUseCase {
  constructor(private readonly pedidoRepository: IPedidoRepository) {}

  async execute(id: string, clienteId: string, isAdmin: boolean): Promise<Pedido> {
    const pedido = await this.pedidoRepository.buscarPorId(id)

    if (!pedido) throw new NotFoundError('Pedido')

    // RN11
    if (!isAdmin && pedido.clienteId !== clienteId) {
      throw new ForbiddenError('Você não tem permissão para cancelar este pedido.')
    }

    // RN04 — cancelamento só em AGUARDANDO_CONFIRMACAO (para clientes)
    if (!isAdmin && pedido.status !== StatusPedido.AGUARDANDO_CONFIRMACAO) {
      throw new BusinessError('Pedido só pode ser cancelado enquanto aguarda confirmação.')
    }

    const atualizado = await this.pedidoRepository.atualizar(id, {
      status: StatusPedido.CANCELADO,
    })

    await this.pedidoRepository.registrarHistorico({
      pedidoId: id,
      statusAnterior: pedido.status,
      statusNovo: StatusPedido.CANCELADO,
      origem: isAdmin ? OrigemStatus.SISTEMA : OrigemStatus.CLIENTE,
    })

    return atualizado
  }
}

// ─── Atualizar Status ─────────────────────────────────────────────────────────
export interface AtualizarStatusDTO {
  pedidoId: string
  novoStatus: StatusPedido
  origem: OrigemStatus
}

export class AtualizarStatusPedidoUseCase {
  constructor(private readonly pedidoRepository: IPedidoRepository) {}

  async execute(dto: AtualizarStatusDTO): Promise<Pedido> {
    const pedido = await this.pedidoRepository.buscarPorId(dto.pedidoId)

    if (!pedido) throw new NotFoundError('Pedido')

    // RN05 — validar transição de status
    if (!podeTransicionarPara(pedido.status, dto.novoStatus)) {
      throw new BusinessError(
        `Transição de status inválida: ${pedido.status} → ${dto.novoStatus}.`,
      )
    }

    const atualizado = await this.pedidoRepository.atualizar(dto.pedidoId, {
      status: dto.novoStatus,
    })

    await this.pedidoRepository.registrarHistorico({
      pedidoId: dto.pedidoId,
      statusAnterior: pedido.status,
      statusNovo: dto.novoStatus,
      origem: dto.origem,
    })

    return atualizado
  }
}

// ─── Aplicar Desconto (chamado internamente por Pagamentos) ───────────────────
export interface AplicarDescontoDTO {
  pedidoId: string
  pagamentoId: string
  desconto: number  // em centavos
}

export class AplicarDescontoUseCase {
  constructor(private readonly pedidoRepository: IPedidoRepository) {}

  async execute(dto: AplicarDescontoDTO): Promise<Pedido> {
    const pedido = await this.pedidoRepository.buscarPorId(dto.pedidoId)

    if (!pedido) throw new NotFoundError('Pedido')

    const total = calcularTotalPedido(pedido.subtotal, dto.desconto, pedido.taxaEntrega)

    const atualizado = await this.pedidoRepository.atualizar(dto.pedidoId, {
      pagamentoId: dto.pagamentoId,
      desconto: dto.desconto,
      total,
    })

    return atualizado
  }
}
