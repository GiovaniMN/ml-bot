import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { config } from '../core/config';
import { logger } from '../core/logger';
import { reportarErro } from '../core/erros';
import { sanitizarTexto } from '../core/sanitizacao';
import { sessoesRepo } from '../db/sessoesRepo';
import { processarMensagem } from '../bot/processador';
import {
  buscarPergunta,
  responderPergunta,
  enviarMensagem,
  buscarPedido,
  buscarRastreio,
  enviarMensagemPedido,
} from '../api/mlClient';
import {
  mensagemPagamentoConfirmado,
  mensagemEnviado,
  mensagemEntregue,
} from '../bot/mensagens';

async function processarPedido(orderId: string): Promise<void> {
  try {
    const pedido = await buscarPedido(orderId);
    logger.info({ orderId, status: pedido['status'] }, 'Pedido recebido');

    const status = pedido['status'] as string;
    const itens = (pedido['order_items'] as Record<string, unknown>[]) ?? [];
    const produto = itens.length > 0
      ? ((itens[0] as { item: { title: string } }).item.title)
      : 'Produto';
    const buyer = pedido['buyer'] as Record<string, unknown>;
    const buyerId = String(buyer?.['id'] ?? '');
    const shipping = pedido['shipping'] as Record<string, unknown>;
    const packId = String(shipping?.['id'] ?? '');
    const shippingId = packId;

    if (!packId || !buyerId) {
      logger.warn({ orderId }, 'pack_id ou buyer_id ausente no pedido');
      return;
    }

    if (status === 'paid') {
      const texto = mensagemPagamentoConfirmado(orderId, produto);
      await enviarMensagemPedido(packId, buyerId, texto);
      logger.info({ orderId, buyerId }, 'Mensagem de pagamento enviada');
    } else if (status === 'shipped') {
      const rastreio = await buscarRastreio(shippingId);
      const texto = mensagemEnviado(orderId, produto, rastreio);
      await enviarMensagemPedido(packId, buyerId, texto);
      logger.info({ orderId }, 'Mensagem de envio enviada');
    } else if (status === 'delivered') {
      const texto = mensagemEntregue(orderId, produto);
      await enviarMensagemPedido(packId, buyerId, texto);
      logger.info({ orderId }, 'Mensagem de entrega enviada');
    } else {
      logger.info({ orderId, status }, `Status sem ação configurada`);
    }
  } catch (err) {
    await reportarErro(err, `processar_pedido orderId=${orderId}`);
  }
}

export async function webhookPlugin(app: FastifyInstance): Promise<void> {
  app.post('/ml', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = request.body as Record<string, unknown>;

      // Validação básica da notificação
      if (
        !body['_id'] ||
        !body['topic'] ||
        !body['resource'] ||
        body['application_id'] !== parseInt(config.APP_ID, 10)
      ) {
        logger.warn({ body: JSON.stringify(body).slice(0, 200) }, 'Notificação inválida recebida');
        return reply.send({ status: 'ignored' });
      }

      const topic = body['topic'] as string;
      logger.info({ topic, resource: body['resource'] }, 'Notificação recebida');

      // ─── Perguntas no anúncio (pré-venda) ─────────────────────────────────
      if (topic === 'questions') {
        const resource = String(body['resource']);
        const questionId = resource.replace('/questions/', '');

        const pergunta = await buscarPergunta(questionId);

        if (pergunta['status'] === 'UNANSWERED') {
          const texto = sanitizarTexto(String(pergunta['text'] ?? ''), 500);
          const fromUser = pergunta['from'] as Record<string, unknown>;
          const buyerId = String(fromUser?.['id'] ?? '');
          if (texto) {
            const resposta = await processarMensagem(texto, questionId, buyerId);
            await responderPergunta(questionId, resposta);
            logger.info({ questionId, buyerId }, 'Pergunta respondida');
          }
        } else {
          logger.info({ questionId }, 'Pergunta já respondida');
        }

      // ─── Chat do pedido (pós-venda) ─────────────────────────────────────
      } else if (topic === 'messages') {
        const resource = String(body['resource']);
        const partes = resource.split('/');

        if (partes.includes('packs')) {
          const packId = partes[partes.indexOf('packs') + 1];
          const buyerId = String(body['user_id'] ?? '');
          const texto = sanitizarTexto(String(body['text'] ?? ''), 500);

          if (await sessoesRepo.estaAguardandoHumano(packId)) {
            logger.info({ packId }, 'Conversa aguardando humano');
            const fromUser = body['from'] as Record<string, unknown>;
            const fromUserId = String(fromUser?.['user_id'] ?? '');
            if (fromUserId === config.USER_ID) {
              await sessoesRepo.liberarSessao(packId);
              logger.info({ packId }, 'Bot reativado pelo vendedor');
            }
          } else if (texto) {
            const resposta = await processarMensagem(texto, packId, buyerId);
            await enviarMensagem(packId, resposta);
            logger.info({ packId }, 'Mensagem respondida');
          }
        }

      // ─── Atualizações de pedido ─────────────────────────────────────────
      } else if (topic === 'orders_v2') {
        const orderId = String(body['resource']).replace('/orders/', '');
        await processarPedido(orderId);
      }
    } catch (err) {
      await reportarErro(err, 'receber_notificacao');
    }

    return reply.send({ status: 'ok' });
  });
}
