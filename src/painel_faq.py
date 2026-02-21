from fastapi import APIRouter, Request, Form
from fastapi.responses import RedirectResponse, HTMLResponse
from fastapi.templating import Jinja2Templates
from src.db_faq import carregar_faq, adicionar_faq, remover_faq
from src.auth_painel import esta_logado

router = APIRouter()
templates = Jinja2Templates(directory="src/templates")

@router.get("/", response_class=HTMLResponse)
async def faq_home(request: Request, ok: str = None, erro: str = None):
    if not esta_logado(request):
        return RedirectResponse("/painel/login", status_code=302)
    itens = await carregar_faq()
    return templates.TemplateResponse("faq.html", {
        "request": request,
        "itens": itens,
        "mensagem_sucesso": ok,
        "mensagem_erro": erro
    })

@router.post("/adicionar")
async def faq_adicionar(
    request: Request,
    perguntas: str = Form(...),
    resposta: str = Form(...)
):
    if not esta_logado(request):
        return RedirectResponse("/painel/login", status_code=302)

    palavras = [p.strip().lower() for p in perguntas.split(",") if p.strip()]

    if not palavras or not resposta.strip():
        return RedirectResponse("/painel/faq?erro=Preencha todos os campos", status_code=302)

    await adicionar_faq(palavras, resposta.strip())
    return RedirectResponse("/painel/faq?ok=Pergunta adicionada com sucesso!", status_code=302)

@router.post("/remover")
async def faq_remover(request: Request, id: int = Form(...)):
    if not esta_logado(request):
        return RedirectResponse("/painel/login", status_code=302)

    await remover_faq(id)
    return RedirectResponse("/painel/faq?ok=Pergunta removida com sucesso!", status_code=302)