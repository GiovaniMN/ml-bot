from fastapi import FastAPI
from src.webhook import router as webhook_router
from src.auth import router as auth_router
from src.painel import router as painel_router
from src.painel_faq import router as faq_router
from src.painel_conversas import router as conversas_router

app = FastAPI(title="Jupiter_eletro Bot")

app.include_router(auth_router, prefix="/auth")
app.include_router(webhook_router, prefix="/webhook")
app.include_router(painel_router, prefix="/painel")
app.include_router(faq_router, prefix="/painel/faq")
app.include_router(conversas_router, prefix="/painel/conversas")

@app.get("/")
def health_check():
    return {"status": "online", "bot": "Jupiter_eletro Bot rodando!"}