# Armazena sessões em memória
# formato: { "question_id_ou_pack_id": "estado" }
sessoes = {}

def get_estado(conversa_id: str) -> str:
    return sessoes.get(conversa_id, "ativo")

def set_estado(conversa_id: str, estado: str):
    sessoes[conversa_id] = estado
    print(f"📝 Sessão {conversa_id} → {estado}")

def esta_aguardando_humano(conversa_id: str) -> bool:
    return get_estado(conversa_id) == "aguardando_humano"

def liberar_sessao(conversa_id: str):
    if conversa_id in sessoes:
        del sessoes[conversa_id]
        print(f"✅ Sessão {conversa_id} liberada — bot voltou a atender")