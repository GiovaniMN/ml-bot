from fastapi import APIRouter, Request, Form
from fastapi.responses import RedirectResponse
from fastapi.templating import Jinja2Templates
from src.sessoes import sessoes, liberar_sessao

router = APIRouter()
templates = Jinja2Templates(directory="src/templates")

@router.get("/", response_class=__import__('fastapi').responses.HTMLResponse)
async def conversas_home(request: Request):
    conversas = [
        {"conversa_id": cid, "buyer_id": cid}
        for cid, estado in sessoes.items()
        if estado == "aguardando_humano"
    ]
    return templates.TemplateResponse("conversas.html", {
        "request": request,
        "conversas": conversas
    })

@router.post("/liberar")
async def conversa_liberar(conversa_id: str = Form(...)):
    liberar_sessao(conversa_id)
    return RedirectResponse("/painel/conversas", status_code=302)