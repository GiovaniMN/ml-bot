import httpx
import os
from dotenv import load_dotenv
from src.token_manager import renovar_token

load_dotenv()

USER_ID = os.getenv("USER_ID")

def get_headers():
    return {
        "Authorization": f"Bearer {os.getenv('ACCESS_TOKEN')}",
        "Content-Type": "application/json"
    }

async def chamar_get(url: str):
    async with httpx.AsyncClient() as client:
        response = await client.get(url, headers=get_headers())
        if response.status_code == 401:
            print("⚠️ Token expirado, renovando...")
            await renovar_token()
            response = await client.get(url, headers=get_headers())
        return response.json()

async def chamar_post(url: str, payload: dict):
    async with httpx.AsyncClient() as client:
        response = await client.post(url, headers=get_headers(), json=payload)
        if response.status_code == 401:
            print("⚠️ Token expirado, renovando...")
            await renovar_token()
            response = await client.post(url, headers=get_headers(), json=payload)
        return response.json()

async def buscar_pergunta(question_id: str):
    return await chamar_get(f"https://api.mercadolibre.com/questions/{question_id}")

async def responder_pergunta(question_id: str, texto: str):
    return await chamar_post("https://api.mercadolibre.com/answers", {
        "question_id": int(question_id),
        "text": texto
    })

async def buscar_pedidos_do_comprador(buyer_id: str):
    return await chamar_get(f"https://api.mercadolibre.com/orders/search?seller={USER_ID}&buyer={buyer_id}")

async def buscar_mensagens(pack_id: str):
    return await chamar_get(f"https://api.mercadolibre.com/messages/packs/{pack_id}/sellers/{USER_ID}")

async def enviar_mensagem(pack_id: str, texto: str):
    return await chamar_post(
        f"https://api.mercadolibre.com/messages/packs/{pack_id}/sellers/{USER_ID}",
        {
            "from": {"user_id": USER_ID, "email": ""},
            "to": {"user_id": ""},
            "text": texto
        }
    )