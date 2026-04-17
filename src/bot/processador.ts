import { faqRepo } from '../db/faqRepo';
import { sessoesRepo } from '../db/sessoesRepo';
import { buscarPedidosDoComprador } from '../api/mlClient';
import { notificarVendedor } from '../notificacao/email';
import { detectarIntencaoComFallback, gerarRespostaFaqComFallback } from './ia';
import { logger } from '../core/logger';

const MENU_PRINCIPAL = `👋 Olá! Bem-vindo à *Jupiter_eletro*!

Sou o assistente virtual da loja. Como posso te ajudar?

1️⃣ Consultar status do pedido
2️⃣ Dúvidas frequentes (FAQ)
3️⃣ Falar com o vendedor

Responda com o número da opção desejada.`;

const MENSAGEM_TRANSFERENCIA = `👨‍💼 Entendido! Vou te conectar com nosso vendedor.

Em breve alguém da *Jupiter_eletro* entrará em contato.
🕐 Horário de atendimento: Seg-Sex das 9h às 18h.

Caso seja urgente, você também pode nos contatar pelo Mercado Livre diretamente.`;

const STATUS_TRADUCAO: Record<string, string> = {
  paid: '✅ Pagamento confirmado',
  confirmed: '✅ Confirmado',
  payment_required: '⏳ Aguardando pagamento',
  payment_in_process: '⏳ Pagamento em processamento',
  partially_refunded: '↩️ Parcialmente reembolsado',
  pending_cancel: '⚠️ Cancelamento pendente',
  cancelled: '❌ Cancelado',
  invalid: '❌ Inválido',
};

const ENVIO_TRADUCAO: Record<string, string> = {
  pending: '📦 Preparando para envio',
  handling: '📦 Em separação',
  ready_to_ship: '📦 Pronto para envio',
  shipped: '🚚 Em trânsito',
  delivered: '✅ Entregue',
  not_delivered: '⚠️ Não entregue',
  cancelled: '❌ Cancelado',
};

// ─── Detecção de intenção via palavras-chave (fallback offline) ───────────────

function detectarIntencaoKeyword(texto: string): string {
  const t = texto.toLowerCase().trim();

  if (['1', '1️⃣'].includes(t)) return 'status_pedido';
  if (['2', '2️⃣'].includes(t)) return 'faq';
  if (['3', '3️⃣'].includes(t)) return 'transferir';

  if (/pedido|rastreio|rastrear|entregue|enviou|status|compra|chegou|entrega/.test(t))
    return 'status_pedido';
  if (/vendedor|humano|atendente|pessoa|falar|transfere|transferir/.test(t))
    return 'transferir';
  if (/oi|olá|ola|bom dia|boa tarde|boa noite|hello|ajuda/.test(t))
    return 'saudacao';

  return 'faq';
}

// ─── Consulta de status do pedido ────────────────────────────────────────────

async function buscarStatusPedido(buyerId: string): Promise<string> {
  try {
    const dados = await buscarPedidosDoComprador(buyerId);
    const pedidos = (dados['results'] as Record<string, unknown>[]) ?? [];

    if (!pedidos.length) {
      return (
        '🔍 Não encontrei pedidos vinculados à sua conta em nossa loja.\n\n' +
        'Verifique em *Mercado Livre → Minhas compras* ou entre em contato com o vendedor.'
      );
    }

    const pedido = pedidos[0];
    const orderId = pedido['id'];
    const statusPgto = STATUS_TRADUCAO[pedido['status'] as string] ?? pedido['status'];
    const itens = (pedido['order_items'] as Record<string, unknown>[]) ?? [];
    const nomeProduto =
      itens.length > 0
        ? ((itens[0] as { item: { title: string } }).item.title)
        : 'Produto';
    const statusEnvio =
      ENVIO_TRADUCAO[pedido['shipping_status'] as string] ?? '📦 Verificando status do envio';

    return (
      `🛍️ *Seu pedido mais recente:*\n\n` +
      `📌 Pedido: #${orderId}\n` +
      `📦 Produto: ${nomeProduto}\n` +
      `💳 Pagamento: ${statusPgto}\n` +
      `🚚 Envio: ${statusEnvio}\n\n` +
      `Para mais detalhes acesse *Mercado Livre → Minhas compras*.`
    );
  } catch (err) {
    logger.error({ err }, 'Erro ao buscar pedido');
    return (
      '⚠️ Não consegui buscar seu pedido agora.\n' +
      'Acesse *Mercado Livre → Minhas compras* para verificar o status.'
    );
  }
}

// ─── Processador principal ───────────────────────────────────────────────────

export async function processarMensagem(
  texto: string,
  conversaId: string,
  buyerId: string
): Promise<string> {
  // 1. Tenta detectar intenção via IA
  let intencao = await detectarIntencaoComFallback(texto);

  // 2. Fallback por palavras-chave se IA indisponível
  if (!intencao) {
    intencao = detectarIntencaoKeyword(texto);
  }

  logger.info({ intencao, conversaId, texto: texto.slice(0, 50) }, 'Intenção processada');

  if (intencao === 'saudacao') {
    return MENU_PRINCIPAL;
  }

  if (intencao === 'status_pedido') {
    return buyerId ? buscarStatusPedido(buyerId) : '🔍 Para consultar seu pedido acesse:\n*Mercado Livre → Minhas compras*';
  }

  if (intencao === 'transferir') {
    await sessoesRepo.setEstado(conversaId, 'aguardando_humano', buyerId);
    await notificarVendedor(buyerId, conversaId, texto);
    return MENSAGEM_TRANSFERENCIA;
  }

  // intencao === 'faq'
  const itensFaq = await faqRepo.carregar();
  const respostaIA = await gerarRespostaFaqComFallback(texto, itensFaq);

  if (respostaIA) return respostaIA;

  // IA sinalizou ESCALAR ou está indisponível com base de conhecimento carregada
  if (itensFaq.length) {
    logger.info({ conversaId, texto: texto.slice(0, 50) }, 'FAQ fora do escopo — escalando para humano');
    await sessoesRepo.setEstado(conversaId, 'aguardando_humano', buyerId);
    await notificarVendedor(buyerId, conversaId, texto);
    return (
      'Sua pergunta vai além do que consigo responder automaticamente. ' +
      'Estou transferindo você para nossa equipe de atendimento.\n\n' +
      MENSAGEM_TRANSFERENCIA.split('\n\n').slice(1).join('\n\n')
    );
  }

  // Fallback final: busca por palavras-chave
  const respostaFaq = await faqRepo.buscarPorPalavraChave(texto);
  return respostaFaq ?? MENU_PRINCIPAL;
}
