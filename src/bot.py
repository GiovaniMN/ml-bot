from src.db_faq import buscar_resposta_faq
from src.db_sessoes import set_estado
from src.ml_api import buscar_pedidos_do_comprador
from src.notificacao import notificar_vendedor

MENU_PRINCIPAL = """👋 Olá! Bem-vindo à *Jupiter_eletro*!

Sou o assistente virtual da loja. Como posso te ajudar?

1️⃣ Consultar status do pedido
2️⃣ Dúvidas frequentes (FAQ)
3️⃣ Falar com o vendedor

Responda com o número da opção desejada."""

MENSAGEM_TRANSFERENCIA = """👨‍💼 Entendido! Vou te conectar com nosso vendedor.

Em breve alguém da *Jupiter_eletro* entrará em contato.
🕐 Horário de atendimento: Seg-Sex das 9h às 18h.

Caso seja urgente, você também pode nos contatar pelo Mercado Livre diretamente."""

STATUS_TRADUCAO = {
    "paid": "✅ Pagamento confirmado",
    "confirmed": "✅ Confirmado",
    "payment_required": "⏳ Aguardando pagamento",
    "payment_in_process": "⏳ Pagamento em processamento",
    "partially_refunded": "↩️ Parcialmente reembolsado",
    "pending_cancel": "⚠️ Cancelamento pendente",
    "cancelled": "❌ Cancelado",
    "invalid": "❌ Inválido",
}

ENVIO_TRADUCAO = {
    "pending": "📦 Preparando para envio",
    "handling": "📦 Em separação",
    "ready_to_ship": "📦 Pronto para envio",
    "shipped": "🚚 Em trânsito",
    "delivered": "✅ Entregue",
    "not_delivered": "⚠️ Não entregue",
    "cancelled": "❌ Cancelado",
}

def detectar_intencao(texto: str):
    texto = texto.lower().strip()

    if texto in ["1", "1️⃣"]:
        return "status_pedido"
    if texto in ["2", "2️⃣"]:
        return "faq"
    if texto in ["3", "3️⃣"]:
        return "transferir"

    if any(p in texto for p in ["pedido", "rastreio", "rastrear", "entregue", "enviou", "status", "compra", "chegou", "entrega"]):
        return "status_pedido"
    if any(p in texto for p in ["vendedor", "humano", "atendente", "pessoa", "falar", "transfere", "transferir"]):
        return "transferir"
    if any(p in texto for p in ["oi", "olá", "ola", "bom dia", "boa tarde", "boa noite", "hello", "ajuda"]):
        return "saudacao"

    return "faq"

async def buscar_status_pedido(buyer_id: str):
    try:
        dados = await buscar_pedidos_do_comprador(buyer_id)
        pedidos = dados.get("results", [])

        if not pedidos:
            return (
                "🔍 Não encontrei pedidos vinculados à sua conta em nossa loja.\n\n"
                "Verifique em *Mercado Livre → Minhas compras* ou entre em contato com o vendedor."
            )

        pedido = pedidos[0]
        order_id = pedido.get("id")
        status_pagamento = STATUS_TRADUCAO.get(pedido.get("status", ""), pedido.get("status", ""))
        itens = pedido.get("order_items", [])
        nome_produto = itens[0]["item"]["title"] if itens else "Produto"
        status_envio = ENVIO_TRADUCAO.get(
            pedido.get("shipping_status", ""),
            "📦 Verificando status do envio"
        )

        return (
            f"🛍️ *Seu pedido mais recente:*\n\n"
            f"📌 Pedido: #{order_id}\n"
            f"📦 Produto: {nome_produto}\n"
            f"💳 Pagamento: {status_pagamento}\n"
            f"🚚 Envio: {status_envio}\n\n"
            f"Para mais detalhes acesse *Mercado Livre → Minhas compras*."
        )

    except Exception as e:
        print("Erro ao buscar pedido:", e)
        return (
            "⚠️ Não consegui buscar seu pedido agora.\n"
            "Acesse *Mercado Livre → Minhas compras* para verificar o status."
        )

async def processar_mensagem(texto: str, conversa_id: str, buyer_id: str):
    intencao = detectar_intencao(texto)

    if intencao == "saudacao":
        return MENU_PRINCIPAL

    elif intencao == "status_pedido":
        if buyer_id:
            return await buscar_status_pedido(buyer_id)
        else:
            return "🔍 Para consultar seu pedido acesse:\n*Mercado Livre → Minhas compras*"

    elif intencao == "transferir":
        await set_estado(conversa_id, "aguardando_humano", buyer_id)
        await notificar_vendedor(buyer_id, conversa_id, texto)
        return MENSAGEM_TRANSFERENCIA

    elif intencao == "faq":
        resposta_faq = await buscar_resposta_faq(texto)
        if resposta_faq:
            return resposta_faq
        else:
            return MENU_PRINCIPAL

    return MENU_PRINCIPAL