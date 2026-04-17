// Templates de mensagens automáticas enviadas ao comprador em eventos de pedido

export function mensagemPagamentoConfirmado(orderId: string, produto: string): string {
  return (
    `Olá! 😊 Obrigado pela sua compra na *Jupiter_eletro*!\n\n` +
    `📌 Pedido: #${orderId}\n` +
    `📦 Produto: ${produto}\n\n` +
    `Seu pedido foi confirmado e já estamos separando para envio.\n` +
    `Assim que despacharmos te avisamos aqui!\n\n` +
    `Qualquer dúvida é só perguntar. 🚀`
  );
}

export function mensagemEnviado(orderId: string, produto: string, rastreio: string): string {
  return (
    `📦 Seu pedido foi despachado!\n\n` +
    `📌 Pedido: #${orderId}\n` +
    `📦 Produto: ${produto}\n` +
    `🚚 Código de rastreio: ${rastreio}\n\n` +
    `Acompanhe a entrega em *Mercado Livre → Minhas compras*.\n` +
    `Previsão de entrega em até 10 dias úteis.`
  );
}

export function mensagemEntregue(orderId: string, produto: string): string {
  return (
    `✅ Seu pedido foi entregue!\n\n` +
    `📌 Pedido: #${orderId}\n` +
    `📦 Produto: ${produto}\n\n` +
    `Esperamos que esteja satisfeito com sua compra! 😊\n\n` +
    `⭐ Que tal deixar uma avaliação? Isso nos ajuda muito a continuar ` +
    `melhorando nosso atendimento!\n\n` +
    `Obrigado por comprar na *Jupiter_eletro*! 🛍️`
  );
}
