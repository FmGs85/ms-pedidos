import { buildApp } from './infra/http/app'

const PORT = Number(process.env.PORT) || 3002

async function main() {
  const app = await buildApp()

  try {
    await app.listen({ port: PORT, host: '0.0.0.0' })
    console.log(`🚀 MS Pedidos rodando em http://localhost:${PORT}`)
    console.log(`📄 Swagger disponível em http://localhost:${PORT}/docs`)
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

main()
