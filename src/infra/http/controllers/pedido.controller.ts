import { FastifyRequest, FastifyReply } from 'fastify'
import { CriarPedidoUseCase } from '../../../application/use-cases/pedido/criar-pedido.use-case'
import {
  BuscarPedidoUseCase,
  ListarPedidosUseCase,
  CancelarPedidoUseCase,
  AtualizarStatusPedidoUseCase,
  AplicarDescontoUseCase,
} from '../../../application/use-cases/pedido/pedido.use-cases'
import { AvaliarPedidoUseCase } from '../../../application/use-cases/avaliacao/avaliar-pedido.use-case'
import {
  criarPedidoSchema,
  atualizarStatusSchema,
  avaliarPedidoSchema,
  aplicarDescontoSchema,
  filtrosPedidoSchema,
} from '../schemas/pedido.schema'
import { getAuthUser } from '../middlewares/auth.middleware'
import { StatusPedido, OrigemStatus } from '../../../domain/entities/pedido.entity'
import { AppError } from '../../../domain/errors/app.error'

export class PedidoController {
  constructor(
    private readonly criarPedido: CriarPedidoUseCase,
    private readonly buscarPedido: BuscarPedidoUseCase,
    private readonly listarPedidos: ListarPedidosUseCase,
    private readonly cancelarPedido: CancelarPedidoUseCase,
    private readonly atualizarStatus: AtualizarStatusPedidoUseCase,
    private readonly aplicarDesconto: AplicarDescontoUseCase,
    private readonly avaliarPedido: AvaliarPedidoUseCase,
  ) {}

  // POST /pedidos
  async criar(request: FastifyRequest, reply: FastifyReply) {
    const user = getAuthUser(request)
    const body = criarPedidoSchema.parse(request.body)

    const pedido = await this.criarPedido.execute({
      clienteId: user.sub,
      restauranteId: body.restauranteId,
      itens: body.itens,
      endereco: body.endereco,
      formaPagamento: body.formaPagamento as any,
      taxaEntrega: body.taxaEntrega,
      observacoes: body.observacoes,
    })

    return reply.status(201).send({
      success: true,
      data: pedido,
    })
  }

  // GET /pedidos/:id
  async buscar(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const user = getAuthUser(request)
    const pedido = await this.buscarPedido.execute(
      request.params.id,
      user.sub,
      user.role === 'ADMIN',
    )

    return reply.send({ success: true, data: pedido })
  }

  // GET /pedidos
  async listar(request: FastifyRequest, reply: FastifyReply) {
    const user = getAuthUser(request)
    const filtros = filtrosPedidoSchema.parse(request.query)

    const resultado = await this.listarPedidos.execute(user.sub, {
      status: filtros.status as StatusPedido | undefined,
      dataInicio: filtros.dataInicio ? new Date(filtros.dataInicio) : undefined,
      dataFim: filtros.dataFim ? new Date(filtros.dataFim) : undefined,
      page: filtros.page,
      limit: filtros.limit,
    })

    return reply.send({ success: true, ...resultado })
  }

  // DELETE /pedidos/:id
  async cancelar(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const user = getAuthUser(request)
    const pedido = await this.cancelarPedido.execute(
      request.params.id,
      user.sub,
      user.role === 'ADMIN',
    )

    return reply.send({ success: true, data: pedido })
  }

  // PATCH /pedidos/:id/status
  async atualizarStatusHandler(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) {
    const body = atualizarStatusSchema.parse(request.body)

    const pedido = await this.atualizarStatus.execute({
      pedidoId: request.params.id,
      novoStatus: body.status as StatusPedido,
      origem: body.origem as OrigemStatus,
    })

    return reply.send({ success: true, data: pedido })
  }

  // POST /pedidos/:id/desconto (rota interna — chamada pelo MS Pagamentos)
  async aplicarDescontoHandler(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) {
    const body = aplicarDescontoSchema.parse(request.body)

    const pedido = await this.aplicarDesconto.execute({
      pedidoId: request.params.id,
      pagamentoId: body.pagamentoId,
      desconto: body.desconto,
    })

    return reply.send({ success: true, data: pedido })
  }

  // POST /pedidos/:id/avaliacao
  async avaliar(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const user = getAuthUser(request)
    const body = avaliarPedidoSchema.parse(request.body)

    const avaliacao = await this.avaliarPedido.execute({
      pedidoId: request.params.id,
      clienteId: user.sub,
      nota: body.nota,
      comentario: body.comentario,
    })

    return reply.status(201).send({ success: true, data: avaliacao })
  }
}
