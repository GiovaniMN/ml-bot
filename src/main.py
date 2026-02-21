from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from src.webhook import router as webhook_router
from src.auth import router as auth_router
from src.painel import router as painel_router
from src.painel_faq import router as faq_router
from src.painel_conversas import router as conversas_router
from src.auth_painel import router as auth_painel_router

limiter = Limiter(key_func=get_remote_address)

app = FastAPI(title="Jupiter_eletro Bot")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.include_router(auth_router, prefix="/auth")
app.include_router(webhook_router, prefix="/webhook")
app.include_router(auth_painel_router, prefix="/painel")
app.include_router(painel_router, prefix="/painel")
app.include_router(faq_router, prefix="/painel/faq")
app.include_router(conversas_router, prefix="/painel/conversas")

@app.get("/")
def health_check():
    return {"status": "online", "bot": "Jupiter_eletro Bot rodando!"}