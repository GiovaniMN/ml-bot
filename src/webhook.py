from fastapi import APIRouter, Request
from src.bot import processar_mensagem
from src.ml_api import enviar_mensagem, buscar_pergunta, responder_pergunta
from src.sessoes import esta_aguardando_humano, liberar_sessao

router = APIRouter()

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

            # Verificar se está aguardando humano
            if esta_aguardando_humano(pack_id):
                print(f"👨‍💼 Conversa {pack_id} com humano — bot pausado.")

                # Se for o vendedor respondendo, libera o bot
                if str(body.get("from", {}).get("user_id", "")) == str(177715100):
                    liberar_sessao(pack_id)
                    print(f"✅ Vendedor respondeu — bot reativado para {pack_id}")
            else:
                if texto:
                    resposta = await processar_mensagem(texto, pack_id, buyer_id)
                    await enviar_mensagem(pack_id, resposta)

    return {"status": "ok"}