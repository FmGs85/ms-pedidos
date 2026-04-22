import { Pedido, Endereco, ItemPedido, StatusPedido, FormaPagamento } from '../../../domain/entities/pedido.entity'

export interface PrismaPedidoRaw {
  id: string
  clienteId: string
  restauranteId: string
  entregadorId: string | null
  pagamentoId: string | null
  status: StatusPedido
  enderecoRua: string
  enderecoNumero: string
  enderecoComplemento: string | null
  enderecoBairro: string
  enderecoCidade: string
  enderecoEstado: string
  enderecoCep: string
  enderecoLatitude: any | null
  enderecoLongitude: any | null
  formaPagamento: FormaPagamento
  subtotal: number
  taxaEntrega: number
  desconto: number
  total: number
  observacoes: string | null
  criadoEm: Date
  atualizadoEm: Date
  itens: ItemPedido[]
}

export function toDomainPedido(raw: PrismaPedidoRaw): Pedido {
  return {
    id: raw.id,
    clienteId: raw.clienteId,
    restauranteId: raw.restauranteId,
    entregadorId: raw.entregadorId ?? undefined,
    pagamentoId: raw.pagamentoId ?? undefined,
    status: raw.status,
    itens: raw.itens,
    endereco: {
      rua: raw.enderecoRua,
      numero: raw.enderecoNumero,
      complemento: raw.enderecoComplemento ?? undefined,
      bairro: raw.enderecoBairro,
      cidade: raw.enderecoCidade,
      estado: raw.enderecoEstado,
      cep: raw.enderecoCep,
      latitude: raw.enderecoLatitude ? Number(raw.enderecoLatitude) : undefined,
      longitude: raw.enderecoLongitude ? Number(raw.enderecoLongitude) : undefined,
    },
    formaPagamento: raw.formaPagamento,
    subtotal: raw.subtotal,
    taxaEntrega: raw.taxaEntrega,
    desconto: raw.desconto,
    total: raw.total,
    observacoes: raw.observacoes ?? undefined,
    criadoEm: raw.criadoEm,
    atualizadoEm: raw.atualizadoEm,
  }
}

export function toFlatEndereco(endereco: Endereco) {
  return {
    enderecoRua: endereco.rua,
    enderecoNumero: endereco.numero,
    enderecoComplemento: endereco.complemento ?? null,
    enderecoBairro: endereco.bairro,
    enderecoCidade: endereco.cidade,
    enderecoEstado: endereco.estado,
    enderecoCep: endereco.cep,
    enderecoLatitude: endereco.latitude ?? null,
    enderecoLongitude: endereco.longitude ?? null,
  }
}
