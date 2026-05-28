import { IPedidoRepository } from '../../../domain/interfaces/pedido.repository.interface'
import { MensagemPedido } from '../../../domain/entities/pedido.entity'
import { NotFoundError, ForbiddenError, BusinessError } from '../../../domain/errors/app.error'

// ─── Enviar Mensagem (apenas restaurante) ─────────────────────────────────────
export interface EnviarMensagemDTO {
  pedidoId: string
  remetenteId: string   // restauranteId vindo do token
  texto: string
}

export class EnviarMensagemUseCase {
  constructor(private readonly repository: IPedidoRepository) {}

  async execute(dto: EnviarMensagemDTO): Promise<MensagemPedido> {
    if (!dto.texto.trim()) {
      throw new BusinessError('O texto da mensagem não pode ser vazio.')
    }

    const pedido = await this.repository.buscarPorId(dto.pedidoId)
    if (!pedido) throw new NotFoundError('Pedido')

    // Só o restaurante dono do pedido pode enviar mensagens
    if (pedido.restauranteId !== dto.remetenteId) {
      throw new ForbiddenError('Você não tem permissão para enviar mensagens neste pedido.')
    }

    // Não faz sentido enviar mensagem em pedidos cancelados ou já entregues
    if (pedido.status === 'CANCELADO') {
      throw new BusinessError('Não é possível enviar mensagens em pedidos cancelados.')
    }

    return this.repository.criarMensagem({
      pedidoId: dto.pedidoId,
      remetenteId: dto.remetenteId,
      texto: dto.texto.trim(),
      lida: false,
    })
  }
}

// ─── Listar Mensagens do Pedido ────────────────────────────────────────────────
export interface ListarMensagensDTO {
  pedidoId: string
  solicitanteId: string
  isRestaurante: boolean
}

export class ListarMensagensUseCase {
  constructor(private readonly repository: IPedidoRepository) {}

  async execute(dto: ListarMensagensDTO): Promise<MensagemPedido[]> {
    const pedido = await this.repository.buscarPorId(dto.pedidoId)
    if (!pedido) throw new NotFoundError('Pedido')

    // Cliente só vê mensagens do seu pedido; restaurante só vê de seus pedidos
    if (dto.isRestaurante) {
      if (pedido.restauranteId !== dto.solicitanteId) {
        throw new ForbiddenError('Você não tem permissão para acessar este pedido.')
      }
    } else {
      if (pedido.clienteId !== dto.solicitanteId) {
        throw new ForbiddenError('Você não tem permissão para acessar este pedido.')
      }
    }

    return this.repository.listarMensagens(dto.pedidoId)
  }
}

// ─── Marcar Mensagens como Lidas (apenas cliente) ─────────────────────────────
export interface MarcarLidasDTO {
  pedidoId: string
  clienteId: string
}

export class MarcarMensagensLidasUseCase {
  constructor(private readonly repository: IPedidoRepository) {}

  async execute(dto: MarcarLidasDTO): Promise<void> {
    const pedido = await this.repository.buscarPorId(dto.pedidoId)
    if (!pedido) throw new NotFoundError('Pedido')

    if (pedido.clienteId !== dto.clienteId) {
      throw new ForbiddenError('Você não tem permissão para acessar este pedido.')
    }

    await this.repository.marcarMensagensLidas(dto.pedidoId)
  }
}
