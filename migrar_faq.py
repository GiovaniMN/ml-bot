import asyncio
import json
from pathlib import Path
from src.database import criar_tabelas
from src.db_faq import adicionar_faq

async def migrar():
    await criar_tabelas()
    faq_path = Path("src/faq_data.json")
    if faq_path.exists():
        with open(faq_path, encoding="utf-8") as f:  # ← adiciona encoding="utf-8"
            itens = json.load(f)
        for item in itens:
            await adicionar_faq(item["perguntas"], item["resposta"])
            print(f"✅ Migrado: {item['perguntas']}")
        print("🎉 Migração concluída!")
    else:
        print("⚠️ faq_data.json não encontrado")

asyncio.run(migrar())