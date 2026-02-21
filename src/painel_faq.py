from fastapi import APIRouter, Request, Form
from fastapi.responses import RedirectResponse, HTMLResponse
from fastapi.templating import Jinja2Templates
from src.faq import carregar_faq, salvar_faq
from src.auth_painel import esta_logado

router = APIRouter()
templates = Jinja2Templates(directory="src/templates")

@router.get("/", response_class=HTMLResponse)
async def faq_home(request: Request, ok: str = None, erro: str = None):
    if not esta_logado(request):
        return RedirectResponse("/painel/login", status_code=302)
    itens = carregar_faq()
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
    itens = carregar_faq()
    novo_id = max([i["id"] for i in itens], default=0) + 1
    palavras = [p.strip().lower() for p in perguntas.split(",") if p.strip()]
    if not palavras or not resposta.strip():
        return RedirectResponse("/painel/faq?erro=Preencha todos os campos", status_code=302)
    itens.append({"id": novo_id, "perguntas": palavras, "resposta": resposta.strip()})
    salvar_faq(itens)
    return RedirectResponse("/painel/faq?ok=Pergunta adicionada com sucesso!", status_code=302)

@router.post("/remover")
async def faq_remover(request: Request, id: int = Form(...)):
    if not esta_logado(request):
        return RedirectResponse("/painel/login", status_code=302)
    itens = carregar_faq()
    itens = [i for i in itens if i["id"] != id]
    salvar_faq(itens)
    return RedirectResponse("/painel/faq?ok=Pergunta removida com sucesso!", status_code=302)