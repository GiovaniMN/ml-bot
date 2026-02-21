import os
import bcrypt
from fastapi import APIRouter, Request, Form
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from itsdangerous import URLSafeTimedSerializer, BadSignature
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()
templates = Jinja2Templates(directory="src/templates")

SECRET = os.getenv("SESSION_SECRET", "chave-secreta-padrao")
USUARIO = os.getenv("PAINEL_USUARIO", "admin")
SENHA_HASH = os.getenv("PAINEL_SENHA_HASH", "")
COOKIE_NAME = "painel_session"

serializer = URLSafeTimedSerializer(SECRET)

def verificar_senha(senha_digitada: str) -> bool:
    if not SENHA_HASH:
        return False
    return bcrypt.checkpw(senha_digitada.encode(), SENHA_HASH.encode())

def criar_sessao(usuario: str) -> str:
    return serializer.dumps(usuario)

def verificar_sessao(token: str) -> bool:
    try:
        serializer.loads(token, max_age=86400)
        return True
    except BadSignature:
        return False

def esta_logado(request: Request) -> bool:
    token = request.cookies.get(COOKIE_NAME)
    if not token:
        return False
    return verificar_sessao(token)

@router.get("/login", response_class=HTMLResponse)
async def login_page(request: Request, erro: str = None):
    if esta_logado(request):
        return RedirectResponse("/painel", status_code=302)
    return templates.TemplateResponse("login.html", {
        "request": request,
        "erro": erro
    })

@router.post("/login")
async def login_post(
    request: Request,
    usuario: str = Form(...),
    senha: str = Form(...)
):
    if usuario == USUARIO and verificar_senha(senha):
        token = criar_sessao(usuario)
        response = RedirectResponse("/painel", status_code=302)
        response.set_cookie(
            key=COOKIE_NAME,
            value=token,
            httponly=True,
            secure=True,       # ← apenas HTTPS
            max_age=86400,
            samesite="lax"
        )
        return response
    return RedirectResponse("/painel/login?erro=Usuário ou senha incorretos", status_code=302)

@router.get("/logout")
async def logout():
    response = RedirectResponse("/painel/login", status_code=302)
    response.delete_cookie(COOKIE_NAME)
    return response
