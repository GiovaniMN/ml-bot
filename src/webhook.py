import os
from fastapi import APIRouter, Request
from dotenv import load_dotenv
from src.bot import processar_mensagem
from src.ml_api import enviar_mensagem, buscar_pergunta, responder_pergunta
from src.db_sessoes import esta_aguardando_humano, liberar_sessao
from src.ml_api_pedidos import buscar_pedido, buscar_rastreio, enviar_mensagem_pedido
from src.mensagens_pedido import (
    mensagem_pagamento_confirmado,
    mensagem_enviado,
    mensagem_entregue
)
from src.logger import logger
from src.erros import reportar_erro
from src.sanitizacao import sanitizar_texto

load_dotenv()

USER_ID = os.getenv("USER_ID")
router = APIRouter()

async def processar_pedido(order_id: str):
    try:
        pedido = await buscar_pedido(order_id)
        logger.info("Pedido recebido", extra={"order_id": order_id, "status": pedido.get("status")})

        status = pedido.get("status", "")
        itens = pedido.get("order_items", [])
        produto = itens[0]["item"]["title"] if itens else "Produto"
        buyer_id = str(pedido.get("buyer", {}).get("id", ""))
        shipping = pedido.get("shipping", {})
        pack_id = str(shipping.get("id", ""))
        shipping_id = str(shipping.get("id", ""))

        if not pack_id or not buyer_id:
            logger.warning("pack_id ou buyer_id ausente", extra={"order_id": order_id})
            return

        if status == "paid":
            texto = mensagem_pagamento_confirmado(order_id, produto)
            await enviar_mensagem_pedido(pack_id, buyer_id, texto)
            logger.info("Mensagem de pagamento enviada", extra={"order_id": order_id, "buyer_id": buyer_id})

        elif status == "shipped":
            rastreio = await buscar_rastreio(shipping_id)
            texto = mensagem_enviado(order_id, produto, rastreio)
            await enviar_mensagem_pedido(pack_id, buyer_id, texto)
            logger.info("Mensagem de envio enviada", extra={"order_id": order_id})

        elif status == "delivered":
            texto = mensagem_entregue(order_id, produto)
            await enviar_mensagem_pedido(pack_id, buyer_id, texto)
            logger.info("Mensagem de entrega enviada", extra={"order_id": order_id})

        else:
            logger.info(f"Status '{status}' sem ação", extra={"order_id": order_id})

    except Exception as e:
        await reportar_erro(e, f"processar_pedido order_id={order_id}")

@router.post("/ml")
async def receber_notificacao(request: Request):
    try:
        body = await request.json()

        # Validação básica
        if not all([
            body.get("_id"),
            body.get("topic"),
            body.get("resource"),
            body.get("application_id") == int(os.getenv("APP_ID"))
        ]):
            logger.warning("Notificação inválida recebida", extra={"body": str(body)[:200]})
            return {"status": "ignored"}

        topic = body.get("topic")
        logger.info("Notificação recebida", extra={"topic": topic, "resource": body.get("resource")})

        # Perguntas no anúncio (pré-venda)
        if topic == "questions":
            resource = body.get("resource", "")
            question_id = resource.replace("/questions/", "")

            pergunta = await buscar_pergunta(question_id)

            if pergunta.get("status") == "UNANSWERED":
                texto = sanitizar_texto(pergunta.get("text", ""), limite=500)
                buyer_id = str(pergunta.get("from", {}).get("id", ""))
                if texto:
                    resposta = await processar_mensagem(texto, question_id, buyer_id)
                    await responder_pergunta(question_id, resposta)
                    logger.info("Pergunta respondida", extra={"question_id": question_id, "buyer_id": buyer_id})
            else:
                logger.info("Pergunta já respondida", extra={"question_id": question_id})

        # Chat do pedido (pós-venda)
        elif topic == "messages":
            resource = body.get("resource", "")
            partes = resource.split("/")

            if "packs" in partes:
                pack_id = partes[partes.index("packs") + 1]
                buyer_id = str(body.get("user_id", ""))
                texto = sanitizar_texto(body.get("text", ""), limite=500)

                if await esta_aguardando_humano(pack_id):
                    logger.info("Conversa aguardando humano", extra={"pack_id": pack_id})
                    from_user_id = str(body.get("from", {}).get("user_id", ""))
                    if from_user_id == str(USER_ID):
                        await liberar_sessao(pack_id)
                        logger.info("Bot reativado pelo vendedor", extra={"pack_id": pack_id})
                else:
                    if texto:
                        resposta = await processar_mensagem(texto, pack_id, buyer_id)
                        await enviar_mensagem(pack_id, resposta)
                        logger.info("Mensagem respondida", extra={"pack_id": pack_id})

        # Atualizações de pedido
        elif topic == "orders_v2":
            resource = body.get("resource", "")
            order_id = resource.replace("/orders/", "")
            await processar_pedido(order_id)

    except Exception as e:
        await reportar_erro(e, "receber_notificacao")

    return {"status": "ok"}