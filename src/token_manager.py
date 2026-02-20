import httpx
import os
from dotenv import load_dotenv, set_key
from pathlib import Path

load_dotenv()

ENV_PATH = Path(".env")

async def renovar_token():
    print("🔄 Renovando token...")

    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://api.mercadolibre.com/oauth/token",
            data={
                "grant_type": "refresh_token",
                "client_id": os.getenv("APP_ID"),
                "client_secret": os.getenv("SECRET_KEY"),
                "refresh_token": os.getenv("REFRESH_TOKEN"),
            }
        )
        dados = response.json()

    if "access_token" in dados:
        set_key(ENV_PATH, "ACCESS_TOKEN", dados["access_token"])
        set_key(ENV_PATH, "REFRESH_TOKEN", dados["refresh_token"])
        os.environ["ACCESS_TOKEN"] = dados["access_token"]
        os.environ["REFRESH_TOKEN"] = dados["refresh_token"]
        print("✅ Token renovado com sucesso!")
        return True
    else:
        print(f"❌ Erro ao renovar token: {dados}")
        return False