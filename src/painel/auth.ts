import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import bcrypt from 'bcrypt';
import { config } from '../core/config';

const COOKIE_NAME = 'painel_session';

// ─── Helpers de sessão ───────────────────────────────────────────────────────

export function estaLogado(request: FastifyRequest): boolean {
  return !!(request.session as Record<string, unknown>)['user'];
}

function logarUsuario(request: FastifyRequest, usuario: string): void {
  (request.session as Record<string, unknown>)['user'] = usuario;
}

// ─── Plugin de rotas de autenticação ─────────────────────────────────────────

export async function authPlugin(app: FastifyInstance): Promise<void> {
  // GET /painel/login
  app.get('/login', async (request: FastifyRequest, reply: FastifyReply) => {
    if (estaLogado(request)) return reply.redirect('/painel');

    const query = request.query as Record<string, string>;
    return reply.view('login.ejs', { erro: query['erro'] ?? null });
  });

  // POST /painel/login
  app.post(
    '/login',
    { config: { skipAuth: true } },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const body = request.body as Record<string, string>;
      const usuario = body['usuario'] ?? '';
      const senha = body['senha'] ?? '';

      const usuarioValid = usuario === config.PAINEL_USUARIO;
      const senhaValid = await bcrypt.compare(senha, config.PAINEL_SENHA_HASH);

      if (usuarioValid && senhaValid) {
        logarUsuario(request, usuario);
        await request.session.save();
        return reply.redirect('/painel');
      }

      return reply.redirect('/painel/login?erro=Usuário ou senha incorretos');
    }
  );

  // GET /painel/logout
  app.get('/logout', async (request: FastifyRequest, reply: FastifyReply) => {
    await request.session.destroy();
    return reply.redirect('/painel/login');
  });
}
