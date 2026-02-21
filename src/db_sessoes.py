from datetime import datetime
from sqlalchemy import select, delete
from src.database import AsyncSessionLocal
from src.models import Sessao

async def get_estado(conversa_id: str) -> str:
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(Sessao).where(Sessao.conversa_id == conversa_id)
        )
        sessao = result.scalar_one_or_none()
        return sessao.estado if sessao else "ativo"

async def set_estado(conversa_id: str, estado: str, buyer_id: str = ""):
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(Sessao).where(Sessao.conversa_id == conversa_id)
        )
        sessao = result.scalar_one_or_none()
        if sessao:
            sessao.estado = estado
            sessao.atualizado_em = datetime.utcnow()
        else:
            sessao = Sessao(
                conversa_id=conversa_id,
                estado=estado,
                buyer_id=buyer_id,
                atualizado_em=datetime.utcnow()
            )
            session.add(sessao)
        await session.commit()
        print(f"📝 Sessão {conversa_id} → {estado}")

async def esta_aguardando_humano(conversa_id: str) -> bool:
    estado = await get_estado(conversa_id)
    return estado == "aguardando_humano"

async def liberar_sessao(conversa_id: str):
    async with AsyncSessionLocal() as session:
        await session.execute(
            delete(Sessao).where(Sessao.conversa_id == conversa_id)
        )
        await session.commit()
        print(f"✅ Sessão {conversa_id} liberada — bot voltou a atender")

async def listar_aguardando():
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(Sessao).where(Sessao.estado == "aguardando_humano")
        )
        return result.scalars().all()