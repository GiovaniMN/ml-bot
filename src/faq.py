import json
from pathlib import Path

FAQ_PATH = Path("src/faq_data.json")

def carregar_faq():
    if FAQ_PATH.exists():
        with open(FAQ_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    return []

def salvar_faq(dados: list):
    with open(FAQ_PATH, "w", encoding="utf-8") as f:
        json.dump(dados, f, ensure_ascii=False, indent=4)

def buscar_faq(mensagem: str):
    mensagem = mensagem.lower()
    for item in carregar_faq():
        if any(palavra in mensagem for palavra in item["perguntas"]):
            return item["resposta"]
    return None