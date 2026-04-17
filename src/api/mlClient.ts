import { config } from '../core/config';
import { logger } from '../core/logger';
import { renovarToken } from './tokenManager';

function getHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${process.env['ACCESS_TOKEN'] ?? config.ACCESS_TOKEN}`,
    'Content-Type': 'application/json',
  };
}

async function chamarGet(url: string): Promise<Record<string, unknown>> {
  let response = await fetch(url, { headers: getHeaders() });

  if (response.status === 401) {
    logger.warn('Token expirado — renovando automaticamente');
    await renovarToken();
    response = await fetch(url, { headers: getHeaders() });
  }

  return response.json() as Promise<Record<string, unknown>>;
}

async function chamarPost(
  url: string,
  payload: Record<string, unknown>
): Promise<Record<string, unknown>> {
  let response = await fetch(url, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });

  if (response.status === 401) {
    logger.warn('Token expirado — renovando automaticamente');
    await renovarToken();
    response = await fetch(url, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
  }

  return response.json() as Promise<Record<string, unknown>>;
}

// ─── Perguntas do anúncio ───────────────────────────────────────────────────

export async function buscarPergunta(questionId: string) {
  return chamarGet(`https://api.mercadolibre.com/questions/${questionId}`);
}

export async function responderPergunta(questionId: string, texto: string) {
  return chamarPost('https://api.mercadolibre.com/answers', {
    question_id: parseInt(questionId, 10),
    text: texto,
  });
}

// ─── Mensagens do pedido ─────────────────────────────────────────────────────

export async function buscarMensagens(packId: string) {
  return chamarGet(
    `https://api.mercadolibre.com/messages/packs/${packId}/sellers/${config.USER_ID}`
  );
}

export async function enviarMensagem(packId: string, texto: string) {
  return chamarPost(
    `https://api.mercadolibre.com/messages/packs/${packId}/sellers/${config.USER_ID}`,
    {
      from: { user_id: config.USER_ID, email: '' },
      to: { user_id: '' },
      text: texto,
    }
  );
}

export async function enviarMensagemPedido(packId: string, buyerId: string, texto: string) {
  return chamarPost(
    `https://api.mercadolibre.com/messages/packs/${packId}/sellers/${config.USER_ID}`,
    {
      from: { user_id: parseInt(config.USER_ID, 10), email: '' },
      to: { user_id: parseInt(buyerId, 10) },
      text: texto,
    }
  );
}

// ─── Pedidos ─────────────────────────────────────────────────────────────────

export async function buscarPedidosDoComprador(buyerId: string) {
  return chamarGet(
    `https://api.mercadolibre.com/orders/search?seller=${config.USER_ID}&buyer=${buyerId}`
  );
}

export async function buscarPedido(orderId: string) {
  return chamarGet(`https://api.mercadolibre.com/orders/${orderId}`);
}

export async function buscarRastreio(shippingId: string): Promise<string> {
  const dados = await chamarGet(
    `https://api.mercadolibre.com/shipments/${shippingId}`
  );
  const tracking = dados['tracking_number'];
  return typeof tracking === 'string' && tracking
    ? tracking
    : 'Disponível em breve no Mercado Livre';
}

export async function buscarCompradoresRecentes(diasAtras = 90) {
  const dataInicio = new Date(Date.now() - diasAtras * 86400_000)
    .toISOString()
    .replace(/\.\d+Z$/, '.000-00:00');
  return chamarGet(
    `https://api.mercadolibre.com/orders/search?seller=${config.USER_ID}&order.status=paid&order.date_created.from=${dataInicio}`
  );
}
