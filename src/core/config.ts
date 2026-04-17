import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const schema = z.object({
  // Mercado Livre
  APP_ID: z.string().min(1, 'APP_ID é obrigatório'),
  SECRET_KEY: z.string().min(1, 'SECRET_KEY é obrigatório'),
  ACCESS_TOKEN: z.string().min(1, 'ACCESS_TOKEN é obrigatório'),
  REFRESH_TOKEN: z.string().min(1, 'REFRESH_TOKEN é obrigatório'),
  USER_ID: z.string().min(1, 'USER_ID é obrigatório'),

  // Painel
  PAINEL_USUARIO: z.string().default('admin'),
  PAINEL_SENHA_HASH: z.string().min(1, 'PAINEL_SENHA_HASH é obrigatório'),
  SESSION_SECRET: z.string().min(16, 'SESSION_SECRET deve ter ao menos 16 caracteres'),

  // Banco de dados
  DB_PROVIDER: z.enum(['sqlite', 'postgresql']).default('sqlite'),
  DATABASE_URL: z.string().default('file:./dev.db'),

  // Gemini AI (opcional — degrada graciosamente se ausente)
  GEMINI_API_KEY: z.string().optional(),

  // Email (todos opcionais — notificações são suprimidas se ausentes)
  EMAIL_REMETENTE: z.string().optional(),
  EMAIL_SENHA: z.string().optional(),
  EMAIL_VENDEDOR: z.string().optional(),

  // Server
  NODE_ENV: z.enum(['development', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),
});

function carregarConfig() {
  const resultado = schema.safeParse(process.env);
  if (!resultado.success) {
    console.error('❌ Variáveis de ambiente inválidas:');
    resultado.error.issues.forEach((issue) => {
      console.error(`  • ${issue.path.join('.')}: ${issue.message}`);
    });
    process.exit(1);
  }
  return resultado.data;
}

export const config = carregarConfig();
export type Config = typeof config;
