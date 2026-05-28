import { FastifyRequest, FastifyReply } from 'fastify'
import {
  EnviarMensagemUseCase,
  ListarMensagensUseCase,
  MarcarMensagensLidasUseCase,
} from '../../../application/use-cases/mensagem/mensagem.use-cases'
import { enviarMensagemSchema } from '../schemas/pedido.schema'
import { getAuthUser } from '../middlewares/auth.middleware'

export class MensagemController {
  constructor(
    private readonly enviarMensagem: EnviarMensagemUseCase,
    private readonly listarMensagens: ListarMensagensUseCase,
    private readonly marcarLidas: MarcarMensagensLidasUseCase,
  ) {}

  // POST /pedidos/:id/mensagens
  async enviar(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) {
    const user = getAuthUser(request)
    const body = enviarMensagemSchema.parse(request.body)

    const mensagem = await this.enviarMensagem.execute({
      pedidoId: request.params.id,
      remetenteId: String(user.id),
      texto: body.texto,
    })

    return reply.status(201).send({ success: true, data: mensagem })
  }

  // GET /pedidos/:id/mensagens
  async listar(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) {
    const user = getAuthUser(request)
    const isRestaurante = user.role === 'RESTAURANTE'

    const mensagens = await this.listarMensagens.execute({
      pedidoId: request.params.id,
      solicitanteId: String(user.id),
      isRestaurante,
    })

    return reply.send({ success: true, data: mensagens })
  }

  // PATCH /pedidos/:id/mensagens/lidas
  async marcarComoLidas(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) {
    const user = getAuthUser(request)

    await this.marcarLidas.execute({
      pedidoId: request.params.id,
      clienteId: String(user.id),
    })

    return reply.send({ success: true, message: 'Mensagens marcadas como lidas.' })
  }
}
