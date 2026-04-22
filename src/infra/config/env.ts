import { z } from 'zod'

const envSchema = z.object({
  DATABASE_URL: z.string().url('DATABASE_URL deve ser uma URL válida'),
  PORT: z.coerce.number().default(3002),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  JWT_SECRET: z.string().min(8, 'JWT_SECRET deve ter pelo menos 8 caracteres'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_SECRET: z.string().min(8, 'JWT_REFRESH_SECRET deve ter pelo menos 8 caracteres'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  MS_USUARIOS_URL: z.string().url().default('http://localhost:3001'),
  MS_RESTAURANTES_URL: z.string().url().default('http://localhost:3003'),
  MS_PAGAMENTOS_URL: z.string().url().default('http://localhost:3004'),
  MS_ENTREGADORES_URL: z.string().url().default('http://localhost:3005'),
})

export type Env = z.infer<typeof envSchema>

/**
 * Valida as variáveis de ambiente no startup.
 * Lança erro descritivo se alguma obrigatória estiver ausente ou inválida.
 */
export function validateEnv(): Env {
  const result = envSchema.safeParse(process.env)

  if (!result.success) {
    const formatted = result.error.issues
      .map((i) => `  ✗ ${i.path.join('.')}: ${i.message}`)
      .join('\n')

    throw new Error(
      `\n❌ Variáveis de ambiente inválidas:\n${formatted}\n\n` +
        'Copie .env.example para .env e preencha os valores.\n',
    )
  }

  return result.data
}
