from fastapi import Request
from fastapi.responses import RedirectResponse
from src.auth_painel import esta_logado

def verificar_login(request: Request):
    if not esta_logado(request):
        return RedirectResponse("/painel/login", status_code=302)
    return None