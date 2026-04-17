import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import fastifyView from '@fastify/view';
import fastifyCookie from '@fastify/cookie';
import fastifySession from '@fastify/session';
import fastifyFormBody from '@fastify/formbody';
import fastifyRateLimit from '@fastify/rate-limit';
import ejs from 'ejs';
import path from 'path';

import { config } from './core/config';
import { logger } from './core/logger';
import { prisma } from './db/client';
import { authPlugin } from './painel/auth';
import { dashboardPlugin } from './painel/dashboard';
import { faqPlugin } from './painel/faq';
import { conversasPlugin } from './painel/conversas';
import { configuracoesPlugin } from './painel/configuracoes';
import { webhookPlugin } from './webhook/router';

// ─── Declaração de tipo da sessão ─────────────────────────────────────────────
declare module '@fastify/session' {
  interface SessionData {
    user?: string;
  }
}

async function buildApp() {
  const app = Fastify({
    logger: false, // usamos Pino diretamente
  });

  // Plugins de parsing e segurança
  await app.register(fastifyFormBody);
  await app.register(fastifyCookie);
  // @fastify/session exige mínimo 32 chars; padding se necessário (retrocompatível)
  const sessionSecret = config.SESSION_SECRET.padEnd(32, '0');

  await app.register(fastifySession, {
    cookieName: 'painel_session',
    secret: sessionSecret,
    cookie: {
      secure: config.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 86400000, // 24h em ms
      sameSite: 'lax',
    },
    saveUninitialized: false,
  });

  // Rate limiting (só para o webhook — evita abuso)
  await app.register(fastifyRateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });

  // Arquivos estáticos: CSS, JS
  await app.register(fastifyStatic, {
    root: path.join(__dirname, 'static'),
    prefix: '/static/',
  });

  // Template engine EJS
  await app.register(fastifyView, {
    engine: { ejs },
    root: path.join(__dirname, 'views'),
    includeViewExtension: false,
  });

  // ─── Rotas ──────────────────────────────────────────────────────────────────

  // Health check
  app.get('/', async (_request, reply) => {
    return reply.send({ status: 'online', bot: 'Jupiter_eletro Bot rodando!' });
  });

  // Webhook ML
  app.register(webhookPlugin, { prefix: '/webhook' });

  // Painel admin
  app.register(authPlugin, { prefix: '/painel' });
  app.register(dashboardPlugin, { prefix: '/painel' });
  app.register(faqPlugin, { prefix: '/painel/faq' });
  app.register(conversasPlugin, { prefix: '/painel/conversas' });
  app.register(configuracoesPlugin, { prefix: '/painel/configuracoes' });

  // Redirect /painel/login sem prefixo duplicado (já coberto pelo authPlugin)
  app.setErrorHandler(async (error, _request, reply) => {
    logger.error({ err: error }, 'Erro não tratado');
    return reply.status(500).send({ status: 'error', message: 'Erro interno do servidor' });
  });

  return app;
}

// ─── Inicialização ────────────────────────────────────────────────────────────

async function main() {
  try {
    // Garante que as tabelas existam (Prisma já cria via migrate, mas útil em dev)
    await prisma.$connect();
    logger.info('✅ Banco de dados conectado');

    const app = await buildApp();
    await app.listen({ host: '0.0.0.0', port: config.PORT });

    logger.info(`🚀 Jupiter_eletro Bot rodando em http://localhost:${config.PORT}`);
    logger.info(`📋 Painel: http://localhost:${config.PORT}/painel`);
  } catch (err) {
    logger.error({ err }, 'Falha ao iniciar o servidor');
    await prisma.$disconnect();
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('🛑 Encerrando servidor...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('🛑 Encerrando servidor (SIGINT)...');
  await prisma.$disconnect();
  process.exit(0);
});

main();
