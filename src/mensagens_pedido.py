def mensagem_pagamento_confirmado(order_id: str, produto: str) -> str:
    return (
        f"Olá! 😊 Obrigado pela sua compra na *Jupiter_eletro*!\n\n"
        f"📌 Pedido: #{order_id}\n"
        f"📦 Produto: {produto}\n\n"
        f"Seu pedido foi confirmado e já estamos separando para envio.\n"
        f"Assim que despacharmos te avisamos aqui!\n\n"
        f"Qualquer dúvida é só perguntar. 🚀"
    )

def mensagem_enviado(order_id: str, produto: str, rastreio: str) -> str:
    return (
        f"📦 Seu pedido foi despachado!\n\n"
        f"📌 Pedido: #{order_id}\n"
        f"📦 Produto: {produto}\n"
        f"🚚 Código de rastreio: {rastreio}\n\n"
        f"Acompanhe a entrega em *Mercado Livre → Minhas compras*.\n"
        f"Previsão de entrega em até 10 dias úteis."
    )

def mensagem_entregue(order_id: str, produto: str) -> str:
    return (
        f"✅ Seu pedido foi entregue!\n\n"
        f"📌 Pedido: #{order_id}\n"
        f"📦 Produto: {produto}\n\n"
        f"Esperamos que esteja satisfeito com sua compra! 😊\n\n"
        f"⭐ Que tal deixar uma avaliação? Isso nos ajuda muito a continuar "
        f"melhorando nosso atendimento!\n\n"
        f"Obrigado por comprar na *Jupiter_eletro*! 🛍️"
    )