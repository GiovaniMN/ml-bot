import os
from datetime import datetime, timedelta
from fastapi import APIRouter, Request, Form
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from dotenv import load_dotenv
from src.ml_api import chamar_get
from src.ml_api_pedidos import enviar_mensagem_pedido
from src.auth_painel import esta_logado

load_dotenv()

router = APIRouter()
templates = Jinja2Templates(directory="src/templates")

USER_ID = os.getenv("USER_ID")

async def buscar_compradores_90_dias():
    data_inicio = (datetime.now() - timedelta(days=90)).strftime("%Y-%m-%dT00:00:00.000-00:00")
    url = (
        f"https://api.mercadolibre.com/orders/search"
        f"?seller={USER_ID}&order.status=paid&order.date_created.from={data_inicio}"
    )
    dados = await chamar_get(url)
    pedidos = dados.get("results", [])
    compradores = []
    pack_ids_vistos = set()
    for pedido in pedidos:
        shipping = pedido.get("shipping", {})
        pack_id = str(shipping.get("id", ""))
        buyer_id = str(pedido.get("buyer", {}).get("id", ""))
        itens = pedido.get("order_items", [])
        produto = itens[0]["item"]["title"] if itens else "Produto"
        data_str = pedido.get("date_created", "")[:10]
        if pack_id and pack_id not in pack_ids_vistos and buyer_id:
            pack_ids_vistos.add(pack_id)
            compradores.append({
                "pack_id": pack_id,
                "buyer_id": buyer_id,
                "produto": produto,
                "data": data_str
            })
    return compradores

@router.get("/", response_class=HTMLResponse)
async def painel_home(request: Request, ok: str = None, erro: str = None):
    if not esta_logado(request):
        return RedirectResponse("/painel/login", status_code=302)
    compradores = await buscar_compradores_90_dias()
    return templates.TemplateResponse("painel.html", {
        "request": request,
        "compradores": compradores,
        "mensagem_sucesso": f"Mensagem enviada para {ok} comprador(es)!" if ok else None,
        "mensagem_erro": erro
    })

@router.post("/enviar")
async def enviar_promocao(
    request: Request,
    mensagem: str = Form(...),
    pack_ids: list[str] = Form(default=[])
):
    if not esta_logado(request):
        return RedirectResponse("/painel/login", status_code=302)
    if not mensagem.strip():
        return RedirectResponse("/painel?erro=Mensagem não pode estar vazia", status_code=302)
    if not pack_ids:
        return RedirectResponse("/painel?erro=Selecione ao menos um comprador", status_code=302)
    enviados = 0
    for item in pack_ids:
        try:
            pack_id, buyer_id = item.split("|")
            await enviar_mensagem_pedido(pack_id, buyer_id, mensagem.strip())
            enviados += 1
        except Exception as e:
            print(f"❌ Erro ao enviar para {item}: {e}")
    return RedirectResponse(f"/painel?ok={enviados}", status_code=302)