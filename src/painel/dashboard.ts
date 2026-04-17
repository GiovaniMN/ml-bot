import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { estaLogado } from './auth';
import { logger } from '../core/logger';
import { buscarCompradoresRecentes, enviarMensagemPedido } from '../api/mlClient';

interface Comprador {
  pack_id: string;
  buyer_id: string;
  produto: string;
  data: string;
}

async function buscarCompradores90Dias(): Promise<Comprador[]> {
  const dados = await buscarCompradoresRecentes(90);
  const pedidos = (dados['results'] as Record<string, unknown>[]) ?? [];

  const compradores: Comprador[] = [];
  const packIdsVistos = new Set<string>();

  for (const pedido of pedidos) {
    const shipping = pedido['shipping'] as Record<string, unknown>;
    const packId = String(shipping?.['id'] ?? '');
    const buyer = pedido['buyer'] as Record<string, unknown>;
    const buyerId = String(buyer?.['id'] ?? '');
    const itens = (pedido['order_items'] as Record<string, unknown>[]) ?? [];
    const produto = itens.length > 0
      ? ((itens[0] as { item: { title: string } }).item.title)
      : 'Produto';
    const dataStr = String(pedido['date_created'] ?? '').slice(0, 10);

    if (packId && !packIdsVistos.has(packId) && buyerId) {
      packIdsVistos.add(packId);
      compradores.push({ pack_id: packId, buyer_id: buyerId, produto, data: dataStr });
    }
  }

  return compradores;
}

export async function dashboardPlugin(app: FastifyInstance): Promise<void> {
  // GET /painel
  app.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    if (!estaLogado(request)) return reply.redirect('/painel/login');

    const query = request.query as Record<string, string>;

    try {
      const compradores = await buscarCompradores90Dias();
      return reply.view('painel.ejs', {
        compradores,
        mensagem_sucesso: query['ok'] ? `Mensagem enviada para ${query['ok']} comprador(es)!` : null,
        mensagem_erro: query['erro'] ?? null,
      });
    } catch (_err) {
      return reply.view('painel.ejs', {
        compradores: [],
        mensagem_sucesso: null,
        mensagem_erro: 'Não foi possível carregar compradores — verifique o token ML.',
      });
    }
  });

  // POST /painel/enviar
  app.post('/enviar', async (request: FastifyRequest, reply: FastifyReply) => {
    if (!estaLogado(request)) return reply.redirect('/painel/login');

    const body = request.body as Record<string, unknown>;
    const mensagem = String(body['mensagem'] ?? '').trim();
    const rawPackIds = body['pack_ids'];
    const packIds: string[] = Array.isArray(rawPackIds)
      ? rawPackIds.map(String)
      : rawPackIds
      ? [String(rawPackIds)]
      : [];

    if (!mensagem) return reply.redirect('/painel?erro=Mensagem não pode estar vazia');
    if (!packIds.length) return reply.redirect('/painel?erro=Selecione ao menos um comprador');

    let enviados = 0;
    for (const item of packIds) {
      try {
        const [packId, buyerId] = item.split('|');
        await enviarMensagemPedido(packId, buyerId, mensagem);
        enviados++;
      } catch (err) {
        logger.error({ err, item }, 'Erro ao enviar mensagem da campanha');
      }
    }

    return reply.redirect(`/painel?ok=${enviados}`);
  });
}
