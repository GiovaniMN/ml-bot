from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from src.database import criar_tabelas
from src.webhook import router as webhook_router
from src.auth import router as auth_router
from src.painel import router as painel_router
from src.painel_faq import router as faq_router
from src.painel_conversas import router as conversas_router
from src.auth_painel import router as auth_painel_router
from src.logger import logger
from src.erros import reportar_erro

limiter = Limiter(key_func=get_remote_address)

@asynccontextmanager
async def lifespan(app: FastAPI):
    await criar_tabelas()
    logger.info("✅ Tabelas criadas/verificadas no banco de dados")
    logger.info("🚀 Jupiter_eletro Bot iniciado")
    yield
    logger.info("🛑 Jupiter_eletro Bot encerrado")

app = FastAPI(title="Jupiter_eletro Bot", lifespan=lifespan)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.exception_handler(Exception)
async def erro_global(request: Request, exc: Exception):
    await reportar_erro(exc, f"erro_global {request.url}")
    return JSONResponse(
        status_code=500,
        content={"status": "error", "message": "Erro interno do servidor"}
    )

app.include_router(auth_router, prefix="/auth")
app.include_router(webhook_router, prefix="/webhook")
app.include_router(auth_painel_router, prefix="/painel")
app.include_router(painel_router, prefix="/painel")
app.include_router(faq_router, prefix="/painel/faq")
app.include_router(conversas_router, prefix="/painel/conversas")

@app.get("/")
def health_check():
    return {"status": "online", "bot": "Jupiter_eletro Bot rodando!"}