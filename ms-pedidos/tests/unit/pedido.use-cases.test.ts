import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CriarPedidoUseCase } from '../../src/application/use-cases/pedido/criar-pedido.use-case'
import {
  CancelarPedidoUseCase,
  AtualizarStatusPedidoUseCase,
} from '../../src/application/use-cases/pedido/pedido.use-cases'
import { AvaliarPedidoUseCase } from '../../src/application/use-cases/avaliacao/avaliar-pedido.use-case'
import { StatusPedido, FormaPagamento, OrigemStatus } from '../../src/domain/entities/pedido.entity'
import { BusinessError, ForbiddenError, NotFoundError, ConflictError } from '../../src/domain/errors/app.error'
import { IPedidoRepository } from '../../src/domain/interfaces/pedido.repository.interface'

// ─── Mock do repositório ──────────────────────────────────────────────────────
const mockRepo = (): IPedidoRepository => ({
  criar: vi.fn(),
  buscarPorId: vi.fn(),
  listarPorCliente: vi.fn(),
  atualizar: vi.fn(),
  registrarHistorico: vi.fn(),
  buscarHistorico: vi.fn(),
  criarAvaliacao: vi.fn(),
  buscarAvaliacao: vi.fn(),
})

const pedidoBase = {
  id: 'uuid-pedido-1',
  clienteId: 'uuid-cliente-1',
  restauranteId: 'uuid-restaurante-1',
  status: StatusPedido.AGUARDANDO_CONFIRMACAO,
  itens: [
    { produtoId: 'uuid-prod-1', nomeProduto: 'Pizza', quantidade: 1, precoUnitario: 4500, subtotal: 4500 },
  ],
  enderecoRua: 'Rua A', enderecoNumero: '10', enderecoBairro: 'Centro',
  enderecoCidade: 'Rio de Janeiro', enderecoEstado: 'RJ', enderecoCep: '20000-000',
  formaPagamento: FormaPagamento.PIX,
  subtotal: 4500, taxaEntrega: 500, desconto: 0, total: 5000,
  criadoEm: new Date(), atualizadoEm: new Date(),
}

// ─── CriarPedidoUseCase ───────────────────────────────────────────────────────
describe('CriarPedidoUseCase', () => {
  let repo: IPedidoRepository

  beforeEach(() => { repo = mockRepo() })

  it('deve criar pedido com sucesso', async () => {
    vi.mocked(repo.criar).mockResolvedValue(pedidoBase)
    vi.mocked(repo.registrarHistorico).mockResolvedValue()

    const useCase = new CriarPedidoUseCase(repo)
    const resultado = await useCase.execute({
      clienteId: 'uuid-cliente-1',
      restauranteId: 'uuid-restaurante-1',
      itens: [{ produtoId: 'uuid-prod-1', nomeProduto: 'Pizza', quantidade: 1, precoUnitario: 4500 }],
      enderecoRua: 'Rua A', enderecoNumero: '10', enderecoBairro: 'Centro',
      enderecoCidade: 'Rio de Janeiro', enderecoEstado: 'RJ', enderecoCep: '20000-000',
      formaPagamento: FormaPagamento.PIX,
      taxaEntrega: 500,
    })

    expect(resultado).toEqual(pedidoBase)
    expect(repo.criar).toHaveBeenCalledOnce()
    expect(repo.registrarHistorico).toHaveBeenCalledOnce()
  })

  it('deve lançar erro se não houver itens', async () => {
    const useCase = new CriarPedidoUseCase(repo)
    await expect(
      useCase.execute({
        clienteId: 'uuid-cliente-1', restauranteId: 'uuid-restaurante-1', itens: [],
        enderecoRua: 'Rua A', enderecoNumero: '10', enderecoBairro: 'Centro',
        enderecoCidade: 'Rio', enderecoEstado: 'RJ', enderecoCep: '20000-000',
        formaPagamento: FormaPagamento.PIX, taxaEntrega: 0,
      }),
    ).rejects.toThrow(BusinessError)
  })

  it('deve lançar erro se quantidade do item for zero', async () => {
    const useCase = new CriarPedidoUseCase(repo)
    await expect(
      useCase.execute({
        clienteId: 'uuid-cliente-1', restauranteId: 'uuid-restaurante-1',
        itens: [{ produtoId: 'uuid-prod-1', nomeProduto: 'Pizza', quantidade: 0, precoUnitario: 4500 }],
        enderecoRua: 'Rua A', enderecoNumero: '10', enderecoBairro: 'Centro',
        enderecoCidade: 'Rio', enderecoEstado: 'RJ', enderecoCep: '20000-000',
        formaPagamento: FormaPagamento.PIX, taxaEntrega: 0,
      }),
    ).rejects.toThrow(BusinessError)
  })
})

// ─── CancelarPedidoUseCase ────────────────────────────────────────────────────
describe('CancelarPedidoUseCase', () => {
  let repo: IPedidoRepository

  beforeEach(() => { repo = mockRepo() })

  it('deve cancelar pedido em AGUARDANDO_CONFIRMACAO', async () => {
    vi.mocked(repo.buscarPorId).mockResolvedValue(pedidoBase)
    vi.mocked(repo.atualizar).mockResolvedValue({ ...pedidoBase, status: StatusPedido.CANCELADO })
    vi.mocked(repo.registrarHistorico).mockResolvedValue()

    const useCase = new CancelarPedidoUseCase(repo)
    const resultado = await useCase.execute('uuid-pedido-1', 'uuid-cliente-1', false)

    expect(resultado.status).toBe(StatusPedido.CANCELADO)
  })

  it('deve lançar erro se pedido já estiver confirmado', async () => {
    vi.mocked(repo.buscarPorId).mockResolvedValue({ ...pedidoBase, status: StatusPedido.CONFIRMADO })

    const useCase = new CancelarPedidoUseCase(repo)
    await expect(useCase.execute('uuid-pedido-1', 'uuid-cliente-1', false)).rejects.toThrow(BusinessError)
  })

  it('deve lançar ForbiddenError se cliente tentar cancelar pedido de outro cliente', async () => {
    vi.mocked(repo.buscarPorId).mockResolvedValue(pedidoBase)

    const useCase = new CancelarPedidoUseCase(repo)
    await expect(useCase.execute('uuid-pedido-1', 'uuid-outro-cliente', false)).rejects.toThrow(ForbiddenError)
  })
})

// ─── AtualizarStatusPedidoUseCase ─────────────────────────────────────────────
describe('AtualizarStatusPedidoUseCase', () => {
  let repo: IPedidoRepository

  beforeEach(() => { repo = mockRepo() })

  it('deve avançar status de AGUARDANDO para CONFIRMADO', async () => {
    vi.mocked(repo.buscarPorId).mockResolvedValue(pedidoBase)
    vi.mocked(repo.atualizar).mockResolvedValue({ ...pedidoBase, status: StatusPedido.CONFIRMADO })
    vi.mocked(repo.registrarHistorico).mockResolvedValue()

    const useCase = new AtualizarStatusPedidoUseCase(repo)
    const resultado = await useCase.execute({
      pedidoId: 'uuid-pedido-1',
      novoStatus: StatusPedido.CONFIRMADO,
      origem: OrigemStatus.PAGAMENTOS,
    })

    expect(resultado.status).toBe(StatusPedido.CONFIRMADO)
  })

  it('deve lançar erro em transição inválida (pular etapa)', async () => {
    vi.mocked(repo.buscarPorId).mockResolvedValue(pedidoBase)

    const useCase = new AtualizarStatusPedidoUseCase(repo)
    await expect(
      useCase.execute({
        pedidoId: 'uuid-pedido-1',
        novoStatus: StatusPedido.ENTREGUE, // pula etapas
        origem: OrigemStatus.SISTEMA,
      }),
    ).rejects.toThrow(BusinessError)
  })
})

// ─── AvaliarPedidoUseCase ─────────────────────────────────────────────────────
describe('AvaliarPedidoUseCase', () => {
  let repo: IPedidoRepository

  beforeEach(() => { repo = mockRepo() })

  it('deve avaliar pedido entregue com sucesso', async () => {
    vi.mocked(repo.buscarPorId).mockResolvedValue({ ...pedidoBase, status: StatusPedido.ENTREGUE })
    vi.mocked(repo.buscarAvaliacao).mockResolvedValue(null)
    vi.mocked(repo.criarAvaliacao).mockResolvedValue({
      id: 'uuid-aval', pedidoId: 'uuid-pedido-1', clienteId: 'uuid-cliente-1', nota: 5,
    })

    const useCase = new AvaliarPedidoUseCase(repo)
    const resultado = await useCase.execute({
      pedidoId: 'uuid-pedido-1', clienteId: 'uuid-cliente-1', nota: 5,
    })

    expect(resultado.nota).toBe(5)
  })

  it('deve lançar erro se pedido não estiver entregue', async () => {
    vi.mocked(repo.buscarPorId).mockResolvedValue(pedidoBase) // AGUARDANDO

    const useCase = new AvaliarPedidoUseCase(repo)
    await expect(
      useCase.execute({ pedidoId: 'uuid-pedido-1', clienteId: 'uuid-cliente-1', nota: 5 }),
    ).rejects.toThrow(BusinessError)
  })

  it('deve lançar erro se pedido já foi avaliado', async () => {
    vi.mocked(repo.buscarPorId).mockResolvedValue({ ...pedidoBase, status: StatusPedido.ENTREGUE })
    vi.mocked(repo.buscarAvaliacao).mockResolvedValue({
      id: 'uuid-aval', pedidoId: 'uuid-pedido-1', clienteId: 'uuid-cliente-1', nota: 4,
    })

    const useCase = new AvaliarPedidoUseCase(repo)
    await expect(
      useCase.execute({ pedidoId: 'uuid-pedido-1', clienteId: 'uuid-cliente-1', nota: 5 }),
    ).rejects.toThrow(ConflictError)
  })

  it('deve lançar erro se nota for inválida', async () => {
    vi.mocked(repo.buscarPorId).mockResolvedValue({ ...pedidoBase, status: StatusPedido.ENTREGUE })
    vi.mocked(repo.buscarAvaliacao).mockResolvedValue(null)

    const useCase = new AvaliarPedidoUseCase(repo)
    await expect(
      useCase.execute({ pedidoId: 'uuid-pedido-1', clienteId: 'uuid-cliente-1', nota: 6 }),
    ).rejects.toThrow(BusinessError)
  })
})
