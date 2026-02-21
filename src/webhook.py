import os
from dotenv import load_dotenv
load_dotenv()
USER_ID = os.getenv("USER_ID")

from fastapi import APIRouter, Request
from src.bot import processar_mensagem
from src.ml_api import enviar_mensagem, buscar_pergunta, responder_pergunta
from src.sessoes import esta_aguardando_humano, liberar_sessao
from src.ml_api_pedidos import buscar_pedido, buscar_rastreio, enviar_mensagem_pedido
from src.mensagens_pedido import (
    mensagem_pagamento_confirmado,
    mensagem_enviado,
    mensagem_entregue
)

router = APIRouter()

async def processar_pedido(order_id: str):
    pedido = await buscar_pedido(order_id)
    print("Pedido recebido:", pedido)

    status = pedido.get("status", "")
    itens = pedido.get("order_items", [])
    produto = itens[0]["item"]["title"] if itens else "Produto"
    buyer_id = str(pedido.get("buyer", {}).get("id", ""))
    pack_id = str(pedido.get("shipping", {}).get("id", ""))
    shipping_id = str(pedido.get("shipping", {}).get("id", ""))

    if not pack_id or not buyer_id:
        print("⚠️ pack_id ou buyer_id não encontrado no pedido.")
        return

    if status == "paid":
        texto = mensagem_pagamento_confirmado(order_id, produto)
        resultado = await enviar_mensagem_pedido(pack_id, buyer_id, texto)
        print("📨 Mensagem de pagamento enviada:", resultado)

    elif status == "shipped":
        rastreio = await buscar_rastreio(shipping_id)
        texto = mensagem_enviado(order_id, produto, rastreio)
        resultado = await enviar_mensagem_pedido(pack_id, buyer_id, texto)
        print("📨 Mensagem de envio enviada:", resultado)

    elif status == "delivered":
        texto = mensagem_entregue(order_id, produto)
        resultado = await enviar_mensagem_pedido(pack_id, buyer_id, texto)
        print("📨 Mensagem de entrega enviada:", resultado)

@router.post("/ml")
async def receber_notificacao(request: Request):
    body = await request.json()
    print("Notificação recebida:", body)

    topic = body.get("topic")

    if topic == "questions":
        resource = body.get("resource", "")
        question_id = resource.replace("/questions/", "")

        pergunta = await buscar_pergunta(question_id)
        print("Pergunta:", pergunta)

        if pergunta.get("status") == "UNANSWERED":
            texto = pergunta.get("text", "")
            buyer_id = str(pergunta.get("from", {}).get("id", ""))
            if texto:
                resposta = await processar_mensagem(texto, question_id, buyer_id)
                resultado = await responder_pergunta(question_id, resposta)
                print("Resposta enviada:", resultado)
        else:
            print("Pergunta já respondida, ignorando.")

    elif topic == "messages":
        resource = body.get("resource", "")
        partes = resource.split("/")
        if "packs" in partes:
            pack_id = partes[partes.index("packs") + 1]
            buyer_id = str(body.get("user_id", ""))
            texto = body.get("text", "")

            if esta_aguardando_humano(pack_id):
                print(f"👨‍💼 Conversa {pack_id} com humano — bot pausado.")
                if str(body.get("from", {}).get("user_id", "")) == str(USER_ID):
                    liberar_sessao(pack_id)
            else:
                if texto:
                    resposta = await processar_mensagem(texto, pack_id, buyer_id)
                    await enviar_mensagem(pack_id, resposta)

    elif topic == "orders_v2":
        resource = body.get("resource", "")
        order_id = resource.replace("/orders/", "")
        await processar_pedido(order_id)

    return {"status": "ok"}