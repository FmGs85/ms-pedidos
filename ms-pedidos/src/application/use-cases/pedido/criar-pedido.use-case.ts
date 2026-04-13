import { IPedidoRepository } from '../../../domain/interfaces/pedido.repository.interface'
import {
  Pedido,
  StatusPedido,
  FormaPagamento,
  OrigemStatus,
  Endereco,
  calcularSubtotalItem,
  calcularTotalPedido,
} from '../../../domain/entities/pedido.entity'
import { BusinessError } from '../../../domain/errors/app.error'

export interface CriarPedidoDTO {
  clienteId: string
  restauranteId: string
  itens: Array<{
    produtoId: string
    nomeProduto: string
    quantidade: number
    precoUnitario: number
    observacoes?: string
  }>
  endereco: Endereco
  formaPagamento: FormaPagamento
  taxaEntrega: number
  observacoes?: string
}

// Single Responsibility: apenas cria pedido
export class CriarPedidoUseCase {
  constructor(private readonly pedidoRepository: IPedidoRepository) {}

  async execute(dto: CriarPedidoDTO): Promise<Pedido> {
    // RN01 — ao menos um item
    if (!dto.itens || dto.itens.length === 0) {
      throw new BusinessError('O pedido deve conter pelo menos um item.')
    }

    // RN08 — calcular subtotais e total
    const itensComSubtotal = dto.itens.map(item => {
      if (item.quantidade <= 0) {
        throw new BusinessError(`Quantidade inválida para o produto ${item.nomeProduto}.`)
      }
      if (item.precoUnitario <= 0) {
        throw new BusinessError(`Preço inválido para o produto ${item.nomeProduto}.`)
      }
      return {
        ...item,
        subtotal: calcularSubtotalItem(item.quantidade, item.precoUnitario),
      }
    })

    const subtotal = itensComSubtotal.reduce((acc, item) => acc + item.subtotal, 0)

    // RN12 — subtotal maior que zero
    if (subtotal <= 0) {
      throw new BusinessError('O valor total do pedido deve ser maior que zero.')
    }

    const total = calcularTotalPedido(subtotal, 0, dto.taxaEntrega)

    const pedido = await this.pedidoRepository.criar({
      clienteId: dto.clienteId,
      restauranteId: dto.restauranteId,
      status: StatusPedido.AGUARDANDO_CONFIRMACAO,
      itens: itensComSubtotal,
      endereco: dto.endereco,
      formaPagamento: dto.formaPagamento,
      subtotal,
      taxaEntrega: dto.taxaEntrega,
      desconto: 0,
      total,
      observacoes: dto.observacoes,
    })

    // Registrar histórico inicial
    await this.pedidoRepository.registrarHistorico({
      pedidoId: pedido.id!,
      statusAnterior: undefined,
      statusNovo: StatusPedido.AGUARDANDO_CONFIRMACAO,
      origem: OrigemStatus.CLIENTE,
    })

    return pedido
  }
}
