import json
from sqlalchemy import select, delete
from src.database import AsyncSessionLocal
from src.models import FaqItem

async def carregar_faq():
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(FaqItem).order_by(FaqItem.id))
        itens = result.scalars().all()
        return [
            {
                "id": item.id,
                "perguntas": json.loads(item.perguntas),
                "resposta": item.resposta
            }
            for item in itens
        ]

async def adicionar_faq(perguntas: list, resposta: str):
    async with AsyncSessionLocal() as session:
        item = FaqItem(
            perguntas=json.dumps(perguntas, ensure_ascii=False),
            resposta=resposta
        )
        session.add(item)
        await session.commit()

async def remover_faq(id: int):
    async with AsyncSessionLocal() as session:
        await session.execute(delete(FaqItem).where(FaqItem.id == id))
        await session.commit()

async def buscar_resposta_faq(mensagem: str):
    mensagem = mensagem.lower()
    itens = await carregar_faq()
    for item in itens:
        if any(palavra in mensagem for palavra in item["perguntas"]):
            return item["resposta"]
    return None