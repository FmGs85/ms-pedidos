# 🛵 MS Pedidos — Plataforma de Delivery

Microsserviço responsável pelo **registro, status e histórico de pedidos** da plataforma de delivery.

> Projeto Integrador V — Análise e Desenvolvimento de Sistemas | SENAC Rio | 2025

---

## 📋 Índice

- [Sobre](#sobre)
- [Tecnologias](#tecnologias)
- [Arquitetura](#arquitetura)
- [Pré-requisitos](#pré-requisitos)
- [Instalação](#instalação)
- [Variáveis de Ambiente](#variáveis-de-ambiente)
- [Rodando o Projeto](#rodando-o-projeto)
- [Rotas da API](#rotas-da-api)
- [Testes](#testes)
- [Docker](#docker)

---

## Sobre

O MS Pedidos é um dos cinco microsserviços da plataforma de delivery. Ele é responsável por:

- Criar e gerenciar pedidos de clientes
- Controlar o ciclo de vida do status do pedido
- Registrar histórico de cada mudança de status
- Permitir avaliação de pedidos entregues
- Integrar com os microsserviços de Restaurantes, Pagamentos, Entregadores e Usuários

**Cada microsserviço possui seu próprio banco de dados isolado.** Este serviço **nunca** acessa diretamente o banco de outro serviço.

---

## Tecnologias

| Tecnologia | Uso |
|---|---|
| Node.js + TypeScript | Linguagem e runtime |
| Fastify | Framework HTTP |
| Prisma ORM | Acesso ao banco de dados |
| MySQL | Banco de dados |
| Zod | Validação de dados |
| JWT (@fastify/jwt) | Autenticação |
| Swagger (@fastify/swagger) | Documentação da API |
| Vitest | Testes unitários |
| Docker | Containerização |

---

## Arquitetura

O projeto segue os princípios de **Clean Architecture** e **SOLID**:

```
src/
├── domain/                  # Regras de negócio puras
│   ├── entities/            # Entidades e enums
│   ├── interfaces/          # Contratos (interfaces)
│   └── errors/              # Erros de domínio
├── application/
│   └── use-cases/           # Casos de uso (uma responsabilidade por classe)
│       ├── pedido/
│       └── avaliacao/
└── infra/
    ├── database/
    │   ├── prisma/          # Prisma client
    │   └── repositories/    # Implementação dos repositórios
    └── http/
        ├── controllers/     # Entrada HTTP
        ├── middlewares/     # Auth JWT + RBAC
        ├── routes/          # Definição das rotas
        └── schemas/         # Validação Zod + documentação Swagger
```

**Princípios aplicados:**
- **S** — cada use case tem uma única responsabilidade
- **O** — repositório implementa interface, fácil de trocar
- **L** — erros herdam de AppError sem quebrar comportamento
- **I** — IPedidoRepository define apenas o contrato necessário
- **D** — controllers e use cases dependem de interfaces, não de implementações concretas

---

## Pré-requisitos

- Node.js 20+
- npm 10+
- MySQL 5.7+ (servidor da faculdade ou local)

---

## Instalação

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/ms-pedidos.git
cd ms-pedidos

# Instale as dependências
npm install

# Gere o client do Prisma
npx prisma generate
```

---

## Variáveis de Ambiente

Copie o arquivo de exemplo e preencha com seus dados:

```bash
cp .env.example .env
```

| Variável | Descrição | Exemplo |
|---|---|---|
| `DATABASE_URL` | String de conexão MySQL | `mysql://user:pass@host:3306/db` |
| `PORT` | Porta do servidor | `3002` |
| `NODE_ENV` | Ambiente | `development` |
| `JWT_SECRET` | Chave secreta do JWT | string aleatória longa |
| `JWT_EXPIRES_IN` | Expiração do access token | `15m` |
| `JWT_REFRESH_SECRET` | Chave do refresh token | string aleatória longa |
| `JWT_REFRESH_EXPIRES_IN` | Expiração do refresh token | `7d` |
| `MS_USUARIOS_URL` | URL do MS Usuários | `http://localhost:3001` |
| `MS_RESTAURANTES_URL` | URL do MS Restaurantes | `http://localhost:3003` |
| `MS_PAGAMENTOS_URL` | URL do MS Pagamentos | `http://localhost:3004` |
| `MS_ENTREGADORES_URL` | URL do MS Entregadores | `http://localhost:3005` |

---

## Rodando o Projeto

```bash
# Desenvolvimento (com hot reload)
npm run dev

# Build de produção
npm run build
npm start

# Abrir Prisma Studio (visualizar banco)
npm run prisma:studio
```

O servidor sobe em `http://localhost:3002`
A documentação Swagger fica em `http://localhost:3002/docs`

---

## Rotas da API

### Pedidos

| Método | Rota | Descrição | Auth |
|---|---|---|---|
| `POST` | `/pedidos` | Criar novo pedido | Cliente |
| `GET` | `/pedidos` | Listar histórico do cliente | Cliente |
| `GET` | `/pedidos/:id` | Buscar pedido por ID | Cliente |
| `DELETE` | `/pedidos/:id` | Cancelar pedido | Cliente |
| `PATCH` | `/pedidos/:id/status` | Atualizar status | Admin |
| `POST` | `/pedidos/:id/avaliacao` | Avaliar pedido entregue | Cliente |
| `POST` | `/pedidos/:id/desconto` | Aplicar desconto (interno) | Admin |

### Sistema

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/health` | Health check do serviço |
| `GET` | `/docs` | Documentação Swagger |

### Ciclo de Vida do Status

```
AGUARDANDO_CONFIRMACAO → CONFIRMADO → EM_PREPARO → EM_ENTREGA → ENTREGUE
         ↓                   ↓
      CANCELADO           CANCELADO
```

### Observações sobre valores monetários

Todos os valores (preços, subtotais, totais, taxas, descontos) são trafegados em **centavos** (inteiros) para evitar problemas de arredondamento com ponto flutuante.

Exemplo: R$ 49,90 = `4990`

---

## Testes

```bash
# Rodar todos os testes
npm test

# Modo watch (durante desenvolvimento)
npm run test:watch

# Com relatório de cobertura
npm run test:coverage
```

Os testes unitários cobrem os use cases principais:
- CriarPedidoUseCase
- CancelarPedidoUseCase
- AtualizarStatusPedidoUseCase
- AvaliarPedidoUseCase

---

## Docker

```bash
# Build da imagem
docker build -t ms-pedidos .

# Rodar o container
docker run -p 3002:3002 --env-file .env ms-pedidos
```

---

## Integrações

Este microsserviço consome os seguintes serviços externos via HTTP:

| Microsserviço | Finalidade |
|---|---|
| **Usuários** | Validação do JWT e dados do cliente |
| **Restaurantes e Cardápios** | Validação de produtos e preços ao criar pedido |
| **Pagamentos** | Confirmação de pagamento e aplicação de desconto |
| **Entregadores** | Atribuição de entregador e atualização de status de entrega |

> ⚠️ Este serviço **nunca** acessa o banco de dados dos outros microsserviços diretamente.
