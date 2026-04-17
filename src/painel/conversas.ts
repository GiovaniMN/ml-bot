import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { estaLogado } from './auth';
import { sessoesRepo } from '../db/sessoesRepo';

export async function conversasPlugin(app: FastifyInstance): Promise<void> {
  // GET /painel/conversas
  app.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    if (!estaLogado(request)) return reply.redirect('/painel/login');

    const sessoes = await sessoesRepo.listarAguardando();
    const conversas = sessoes.map((s) => ({
      conversa_id: s.conversaId,
      buyer_id: s.buyerId ?? '',
    }));

    return reply.view('conversas.ejs', { conversas });
  });

  // POST /painel/conversas/liberar
  app.post('/liberar', async (request: FastifyRequest, reply: FastifyReply) => {
    if (!estaLogado(request)) return reply.redirect('/painel/login');

    const body = request.body as Record<string, string>;
    const conversaId = body['conversa_id'] ?? '';

    if (conversaId) {
      await sessoesRepo.liberarSessao(conversaId);
    }

    return reply.redirect('/painel/conversas');
  });
}
