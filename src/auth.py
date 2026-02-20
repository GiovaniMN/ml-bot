import httpx
import os
from fastapi import APIRouter
from dotenv import load_dotenv

load_dotenv()
router = APIRouter()

APP_ID = os.getenv("APP_ID")
SECRET_KEY = os.getenv("SECRET_KEY")
REFRESH_TOKEN = os.getenv("REFRESH_TOKEN")

async def renovar_token():
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://api.mercadolibre.com/oauth/token",
            data={
                "grant_type": "refresh_token",
                "client_id": APP_ID,
                "client_secret": SECRET_KEY,
                "refresh_token": REFRESH_TOKEN,
            }
        )
        dados = response.json()
        print("Token renovado:", dados.get("access_token"))
        return dados

@router.get("/renovar")
async def rota_renovar_token():
    dados = await renovar_token()
    return dados