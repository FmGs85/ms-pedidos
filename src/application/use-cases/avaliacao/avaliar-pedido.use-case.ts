import { IPedidoRepository } from '../../../domain/interfaces/pedido.repository.interface'
import { AvaliacaoPedido, StatusPedido } from '../../../domain/entities/pedido.entity'
import { NotFoundError, ForbiddenError, BusinessError, ConflictError } from '../../../domain/errors/app.error'

export interface AvaliarPedidoDTO {
  pedidoId: string
  clienteId: string
  nota: number
  comentario?: string
}

export class AvaliarPedidoUseCase {
  constructor(private readonly pedidoRepository: IPedidoRepository) {}

  async execute(dto: AvaliarPedidoDTO): Promise<AvaliacaoPedido> {
    const pedido = await this.pedidoRepository.buscarPorId(dto.pedidoId)

    if (!pedido) throw new NotFoundError('Pedido')

    // RN11 — cliente só avalia seu próprio pedido
    if (pedido.clienteId !== dto.clienteId) {
      throw new ForbiddenError('Você não tem permissão para avaliar este pedido.')
    }

    // RN09 — só pedidos entregues
    if (pedido.status !== StatusPedido.ENTREGUE) {
      throw new BusinessError('Só é possível avaliar pedidos com status ENTREGUE.')
    }

    // RN09 — apenas uma avaliação por pedido
    const avaliacaoExistente = await this.pedidoRepository.buscarAvaliacao(dto.pedidoId)
    if (avaliacaoExistente) {
      throw new ConflictError('Este pedido já foi avaliado.')
    }

    // RN09 — nota entre 1 e 5
    if (dto.nota < 1 || dto.nota > 5 || !Number.isInteger(dto.nota)) {
      throw new BusinessError('A nota deve ser um número inteiro entre 1 e 5.')
    }

    return this.pedidoRepository.criarAvaliacao({
      pedidoId: dto.pedidoId,
      clienteId: dto.clienteId,
      nota: dto.nota,
      comentario: dto.comentario,
    })
  }
}
