import { PrismaClient } from '@prisma/client'
import {
  IPedidoRepository,
  FiltrosPedido,
  PaginatedResult,
} from '../../../domain/interfaces/pedido.repository.interface'
import {
  Pedido,
  AvaliacaoPedido,
  HistoricoStatus,
} from '../../../domain/entities/pedido.entity'
import { toDomainPedido, toFlatEndereco } from '../mappers/pedido.mapper'

export class PrismaPedidoRepository implements IPedidoRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async criar(pedido: Omit<Pedido, 'id' | 'criadoEm' | 'atualizadoEm'>): Promise<Pedido> {
    const criado = await this.prisma.pedido.create({
      data: {
        clienteId: pedido.clienteId,
        restauranteId: pedido.restauranteId,
        status: pedido.status,
        ...toFlatEndereco(pedido.endereco),
        formaPagamento: pedido.formaPagamento,
        subtotal: pedido.subtotal,
        taxaEntrega: pedido.taxaEntrega,
        desconto: pedido.desconto,
        total: pedido.total,
        observacoes: pedido.observacoes,
        itens: {
          create: pedido.itens.map(item => ({
            produtoId: item.produtoId,
            nomeProduto: item.nomeProduto,
            quantidade: item.quantidade,
            precoUnitario: item.precoUnitario,
            subtotal: item.subtotal,
            observacoes: item.observacoes,
          })),
        },
      },
      include: { itens: true },
    })
    return toDomainPedido(criado as any)
  }

  async buscarPorId(id: string): Promise<Pedido | null> {
    const pedido = await this.prisma.pedido.findUnique({
      where: { id },
      include: { itens: true, avaliacao: true },
    })
    return pedido ? toDomainPedido(pedido as any) : null
  }

  async listarPorCliente(
    clienteId: string,
    filtros: FiltrosPedido,
  ): Promise<PaginatedResult<Pedido>> {
    const page = filtros.page ?? 1
    const limit = filtros.limit ?? 10
    const skip = (page - 1) * limit

    const where: any = { clienteId }
    if (filtros.status) where.status = filtros.status
    if (filtros.dataInicio || filtros.dataFim) {
      where.criadoEm = {}
      if (filtros.dataInicio) where.criadoEm.gte = filtros.dataInicio
      if (filtros.dataFim) where.criadoEm.lte = filtros.dataFim
    }

    const [data, total] = await Promise.all([
      this.prisma.pedido.findMany({
        where,
        include: { itens: true },
        orderBy: { criadoEm: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.pedido.count({ where }),
    ])

    return {
      data: data.map(p => toDomainPedido(p as any)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  }

  async atualizar(id: string, dados: Partial<Pedido>): Promise<Pedido> {
    const atualizado = await this.prisma.pedido.update({
      where: { id },
      data: {
        status: dados.status,
        entregadorId: dados.entregadorId,
        pagamentoId: dados.pagamentoId,
        desconto: dados.desconto,
        total: dados.total,
      },
      include: { itens: true },
    })
    return toDomainPedido(atualizado as any)
  }

  async registrarHistorico(
    historico: Omit<HistoricoStatus, 'id' | 'registradoEm'>,
  ): Promise<void> {
    await this.prisma.historicoStatus.create({
      data: {
        pedidoId: historico.pedidoId,
        statusAnterior: historico.statusAnterior,
        statusNovo: historico.statusNovo,
        origem: historico.origem,
      },
    })
  }

  async buscarHistorico(pedidoId: string): Promise<HistoricoStatus[]> {
    const registros = await this.prisma.historicoStatus.findMany({
      where: { pedidoId },
      orderBy: { registradoEm: 'asc' },
    })
    return registros.map(r => ({
      id: r.id,
      pedidoId: r.pedidoId,
      statusAnterior: r.statusAnterior ?? undefined,
      statusNovo: r.statusNovo,
      origem: r.origem,
      registradoEm: r.registradoEm,
    }))
  }

  async criarAvaliacao(
    avaliacao: Omit<AvaliacaoPedido, 'id' | 'criadoEm'>,
  ): Promise<AvaliacaoPedido> {
    const criada = await this.prisma.avaliacaoPedido.create({
      data: {
        pedidoId: avaliacao.pedidoId,
        clienteId: avaliacao.clienteId,
        nota: avaliacao.nota,
        comentario: avaliacao.comentario,
      },
    })
    return {
      id: criada.id,
      pedidoId: criada.pedidoId,
      clienteId: criada.clienteId,
      nota: criada.nota,
      comentario: criada.comentario ?? undefined,
      criadoEm: criada.criadoEm,
    }
  }

  async buscarAvaliacao(pedidoId: string): Promise<AvaliacaoPedido | null> {
    const avaliacao = await this.prisma.avaliacaoPedido.findUnique({
      where: { pedidoId },
    })
    if (!avaliacao) return null
    return {
      id: avaliacao.id,
      pedidoId: avaliacao.pedidoId,
      clienteId: avaliacao.clienteId,
      nota: avaliacao.nota,
      comentario: avaliacao.comentario ?? undefined,
      criadoEm: avaliacao.criadoEm,
    }
  }

}

