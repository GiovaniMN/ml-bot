from fastapi import APIRouter, Request, Form
from fastapi.responses import RedirectResponse, HTMLResponse
from fastapi.templating import Jinja2Templates
from src.db_sessoes import listar_aguardando, liberar_sessao
from src.auth_painel import esta_logado

router = APIRouter()
templates = Jinja2Templates(directory="src/templates")

@router.get("/", response_class=HTMLResponse)
async def conversas_home(request: Request):
    if not esta_logado(request):
        return RedirectResponse("/painel/login", status_code=302)

    sessoes_db = await listar_aguardando()
    conversas = [
        {"conversa_id": s.conversa_id, "buyer_id": s.buyer_id}
        for s in sessoes_db
    ]

    return templates.TemplateResponse("conversas.html", {
        "request": request,
        "conversas": conversas
    })

@router.post("/liberar")
async def conversa_liberar(request: Request, conversa_id: str = Form(...)):
    if not esta_logado(request):
        return RedirectResponse("/painel/login", status_code=302)

    await liberar_sessao(conversa_id)
    return RedirectResponse("/painel/conversas", status_code=302)