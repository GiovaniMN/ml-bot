import os
import asyncio
import google.generativeai as genai
from dotenv import load_dotenv
from src.logger import logger

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# ─── Prompts ────────────────────────────────────────────────────────────────

PROMPT_INTENCAO = """Você é um classificador de intenções para um bot de atendimento 
de uma loja de eletrônicos no Mercado Livre chamada Jupiter_eletro.

Classifique a mensagem do cliente em UMA dessas categorias:
- status_pedido: cliente quer saber sobre pedido, entrega, rastreio, envio, onde está
- faq: dúvida sobre garantia, troca, devolução, pagamento, nota fiscal, voltagem, prazo
- transferir: quer falar com humano, vendedor, atendente, pessoa real
- saudacao: oi, olá, bom dia, boa tarde, boa noite, cumprimentos

Responda APENAS com o nome da categoria, sem explicações, sem pontuação."""

PROMPT_FAQ_SISTEMA = """Você é um assistente de atendimento ao cliente da loja de eletrônicos \
Jupiter Eletro no Mercado Livre. Seu tom é profissional, amigável e direto.

Abaixo está a Base de Conhecimento da loja com todas as informações disponíveis:

{contexto_faq}

---
INSTRUÇÕES:
1. Responda à pergunta do cliente usando APENAS as informações da Base de Conhecimento acima.
2. Seja conciso e claro. Máximo de 3 frases.
3. Use linguagem natural e conversacional, sem bullet points ou markdown.
4. Se a pergunta não puder ser respondida com base no contexto acima, responda EXATAMENTE \
com a palavra: ESCALAR
5. Não invente informações que não estejam na Base de Conhecimento.

Pergunta do cliente: {pergunta}"""


# ─── Helper interno ──────────────────────────────────────────────────────────

async def _chamar_gemini(prompt: str, modelo: str) -> str | None:
    """Chama o Gemini de forma assíncrona. Retorna texto ou None em caso de erro."""
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        loop = asyncio.get_event_loop()
        model = genai.GenerativeModel(modelo)
        response = await loop.run_in_executor(
            None,
            lambda: model.generate_content(prompt)
        )
        return response.text.strip()
    except Exception as e:
        logger.warning(f"Falha no modelo {modelo}", extra={"erro": str(e)})
        return None


# ─── Classificação de intenção ───────────────────────────────────────────────

async def detectar_intencao_gemini(texto: str, modelo: str) -> str | None:
    intencoes_validas = ["status_pedido", "faq", "transferir", "saudacao"]
    prompt = f"{PROMPT_INTENCAO}\n\nMensagem do cliente: {texto}"
    resultado = await _chamar_gemini(prompt, modelo)
    if resultado and resultado.lower() in intencoes_validas:
        logger.info("Intenção detectada por IA", extra={
            "modelo": modelo, "intencao": resultado.lower(), "texto": texto[:50]
        })
        return resultado.lower()
    logger.warning("IA retornou intenção inválida", extra={"modelo": modelo, "resposta": resultado})
    return None


async def detectar_intencao_com_fallback(texto: str) -> str | None:
    if not GEMINI_API_KEY:
        logger.warning("GEMINI_API_KEY não configurada")
        return None

    # Camada 1 — Gemini Flash-Lite (gratuito)
    intencao = await detectar_intencao_gemini(texto, "gemini-2.0-flash-lite")
    if intencao:
        return intencao

    # Camada 2 — Gemini Flash (fallback automático)
    logger.info("Fallback de intenção para Gemini Flash")
    intencao = await detectar_intencao_gemini(texto, "gemini-2.0-flash")
    if intencao:
        return intencao

    # Camada 3 — IA indisponível, usa palavras-chave
    logger.warning("IA indisponível — usando palavras-chave como fallback")
    return None


# ─── Geração de resposta FAQ (RAG) ───────────────────────────────────────────

async def gerar_resposta_faq(pergunta: str, itens_faq: list, modelo: str) -> str | None:
    """
    Usa o Gemini como gerador RAG:
    - Monta o contexto com toda a Base de Conhecimento
    - Gera uma resposta natural e conversacional
    - Retorna None se a IA indicar que a pergunta está fora do escopo (ESCALAR)
    """
    if not itens_faq:
        return None

    # Monta o contexto estruturado
    linhas = []
    for i, item in enumerate(itens_faq, 1):
        palavras = ", ".join(item.get("perguntas", []))
        resposta = item.get("resposta", "")
        linhas.append(f"[{i}] Palavras-chave: {palavras}\n    Informação: {resposta}")
    contexto_faq = "\n\n".join(linhas)

    prompt = PROMPT_FAQ_SISTEMA.format(
        contexto_faq=contexto_faq,
        pergunta=pergunta
    )

    resultado = await _chamar_gemini(prompt, modelo)

    if resultado is None:
        return None
    if "ESCALAR" in resultado.upper():
        logger.info("IA sinalizou escalar para humano", extra={"texto": pergunta[:50]})
        return None

    logger.info("Resposta FAQ gerada por IA", extra={"modelo": modelo, "texto": pergunta[:50]})
    return resultado


async def gerar_resposta_faq_com_fallback(pergunta: str, itens_faq: list) -> str | None:
    """
    Tenta gerar resposta com Gemini Flash-Lite, depois Flash como fallback.
    Retorna None se ambos falharem ou indicarem ESCALAR.
    """
    if not GEMINI_API_KEY:
        return None

    # Camada 1 — Gemini Flash-Lite
    resposta = await gerar_resposta_faq(pergunta, itens_faq, "gemini-2.0-flash-lite")
    if resposta:
        return resposta

    # Camada 2 — Gemini Flash (fallback)
    logger.info("Fallback de resposta FAQ para Gemini Flash")
    resposta = await gerar_resposta_faq(pergunta, itens_faq, "gemini-2.0-flash")
    return resposta  # pode ser None, o chamador trata