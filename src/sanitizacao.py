import re

def sanitizar_texto(texto: str, limite: int = 500) -> str:
    if not texto:
        return ""

    # Remover caracteres de controle
    texto = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]', '', texto)

    # Remover scripts e tags HTML
    texto = re.sub(r'<[^>]+>', '', texto)

    # Normalizar espaços
    texto = re.sub(r'\s+', ' ', texto).strip()

    # Aplicar limite de caracteres
    if len(texto) > limite:
        texto = texto[:limite]

    return texto

def sanitizar_faq_pergunta(texto: str) -> str:
    return sanitizar_texto(texto, limite=200).lower()

def sanitizar_faq_resposta(texto: str) -> str:
    return sanitizar_texto(texto, limite=1000)