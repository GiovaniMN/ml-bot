from datetime import datetime
from sqlalchemy import Integer, String, DateTime, Text
from sqlalchemy.orm import Mapped, mapped_column
from src.database import Base

class FaqItem(Base):
    __tablename__ = "faq_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    perguntas: Mapped[str] = mapped_column(Text)  # salvo como JSON string
    resposta: Mapped[str] = mapped_column(Text)
    criado_em: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class Sessao(Base):
    __tablename__ = "sessoes"

    conversa_id: Mapped[str] = mapped_column(String, primary_key=True)
    estado: Mapped[str] = mapped_column(String)
    buyer_id: Mapped[str] = mapped_column(String, nullable=True)
    atualizado_em: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class Token(Base):
    __tablename__ = "tokens"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, default=1)
    access_token: Mapped[str] = mapped_column(Text)
    refresh_token: Mapped[str] = mapped_column(Text)
    atualizado_em: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)