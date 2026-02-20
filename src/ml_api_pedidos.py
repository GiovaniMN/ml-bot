import httpx
import os
from dotenv import load_dotenv
from src.ml_api import get_headers, chamar_get

load_dotenv()

USER_ID = os.getenv("USER_ID")

async def buscar_pedido(order_id: str) -> dict:
    return await chamar_get(f"https://api.mercadolibre.com/orders/{order_id}")

async def buscar_rastreio(shipping_id: str) -> str:
    dados = await chamar_get(f"https://api.mercadolibre.com/shipments/{shipping_id}")
    tracking = dados.get("tracking_number", "")
    return tracking if tracking else "Disponível em breve no Mercado Livre"

async def enviar_mensagem_pedido(pack_id: str, buyer_id: str, texto: str):
    url = f"https://api.mercadolibre.com/messages/packs/{pack_id}/sellers/{USER_ID}"
    payload = {
        "from": {"user_id": int(USER_ID), "email": ""},
        "to": {"user_id": int(buyer_id)},
        "text": texto
    }
    async with httpx.AsyncClient() as client:
        response = await client.post(url, headers=get_headers(), json=payload)
        if response.status_code == 401:
            from src.token_manager import renovar_token
            await renovar_token()
            response = await client.post(url, headers=get_headers(), json=payload)
        return response.json()