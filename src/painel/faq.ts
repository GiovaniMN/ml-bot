import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { estaLogado } from './auth';
import { faqRepo } from '../db/faqRepo';
import { fazerBackupFaq } from '../core/backup';
import { sanitizarFaqPergunta, sanitizarFaqResposta } from '../core/sanitizacao';

export async function faqPlugin(app: FastifyInstance): Promise<void> {
  // GET /painel/faq
  app.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    if (!estaLogado(request)) return reply.redirect('/painel/login');

    const query = request.query as Record<string, string>;
    const itens = await faqRepo.carregar();

    return reply.view('faq.ejs', {
      itens,
      mensagem_sucesso: query['ok'] ?? null,
      mensagem_erro: query['erro'] ?? null,
    });
  });

  // POST /painel/faq/adicionar
  app.post('/adicionar', async (request: FastifyRequest, reply: FastifyReply) => {
    if (!estaLogado(request)) return reply.redirect('/painel/login');

    const body = request.body as Record<string, string>;
    const perguntas = sanitizarFaqPergunta(body['perguntas'] ?? '');
    const resposta = sanitizarFaqResposta(body['resposta'] ?? '');

    const palavras = perguntas
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);

    if (!palavras.length || !resposta.trim()) {
      return reply.redirect('/painel/faq?erro=Preencha todos os campos');
    }

    await faqRepo.adicionar(palavras, resposta.trim());
    await fazerBackupFaq();

    return reply.redirect('/painel/faq?ok=Pergunta adicionada com sucesso!');
  });

  // POST /painel/faq/remover
  app.post('/remover', async (request: FastifyRequest, reply: FastifyReply) => {
    if (!estaLogado(request)) return reply.redirect('/painel/login');

    const body = request.body as Record<string, string>;
    const id = parseInt(body['id'] ?? '0', 10);

    if (!id) return reply.redirect('/painel/faq?erro=ID inválido');

    await faqRepo.remover(id);
    await fazerBackupFaq();

    return reply.redirect('/painel/faq?ok=Pergunta removida com sucesso!');
  });
}
