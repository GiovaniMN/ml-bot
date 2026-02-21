import os
import asyncio
import google.generativeai as genai
from dotenv import load_dotenv
from src.logger import logger

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

PROMPT_SISTEMA = """Você é um classificador de intenções para um bot de atendimento 
de uma loja de eletrônicos no Mercado Livre chamada Jupiter_eletro.

Classifique a mensagem do cliente em UMA dessas categorias:
- status_pedido: cliente quer saber sobre pedido, entrega, rastreio, envio, onde está
- faq: dúvida sobre garantia, troca, devolução, pagamento, nota fiscal, voltagem, prazo
- transferir: quer falar com humano, vendedor, atendente, pessoa real
- saudacao: oi, olá, bom dia, boa tarde, boa noite, cumprimentos

Responda APENAS com o nome da categoria, sem explicações, sem pontuação."""

async def detectar_intencao_gemini(texto: str, modelo: str) -> str | None:
    try:
        genai.configure(api_key=GEMINI_API_KEY)

        # Rodar em executor pois a lib do Gemini é síncrona
        loop = asyncio.get_event_loop()
        model = genai.GenerativeModel(modelo)

        response = await loop.run_in_executor(
            None,
            lambda: model.generate_content(
                f"{PROMPT_SISTEMA}\n\nMensagem do cliente: {texto}"
            )
        )

        intencao = response.text.strip().lower()
        intencoes_validas = ["status_pedido", "faq", "transferir", "saudacao"]

        if intencao in intencoes_validas:
            logger.info("Intenção detectada por IA", extra={
                "modelo": modelo,
                "intencao": intencao,
                "texto": texto[:50]
            })
            return intencao

        logger.warning("IA retornou intenção inválida", extra={
            "modelo": modelo,
            "resposta": intencao
        })
        return None

    except Exception as e:
        logger.warning(f"Falha no modelo {modelo}", extra={"erro": str(e)})
        return None

async def detectar_intencao_com_fallback(texto: str) -> str | None:
    if not GEMINI_API_KEY:
        logger.warning("GEMINI_API_KEY não configurada")
        return None

    # Camada 1 — Gemini Flash-Lite (gratuito)
    intencao = await detectar_intencao_gemini(texto, "gemini-2.0-flash-lite")
    if intencao:
        return intencao

    # Camada 2 — Gemini Flash (pago, fallback automático)
    logger.info("Fallback para Gemini Flash pago")
    intencao = await detectar_intencao_gemini(texto, "gemini-2.0-flash")
    if intencao:
        return intencao

    # Camada 3 — IA indisponível, usa palavras-chave
    logger.warning("IA indisponível — usando palavras-chave como fallback")
    return None