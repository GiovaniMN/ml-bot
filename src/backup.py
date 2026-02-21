import json
import os
from datetime import datetime
from pathlib import Path
from src.db_faq import carregar_faq
from src.logger import logger

BACKUP_DIR = Path("backups")

async def fazer_backup_faq():
    try:
        BACKUP_DIR.mkdir(exist_ok=True)
        itens = await carregar_faq()
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        arquivo = BACKUP_DIR / f"faq_backup_{timestamp}.json"

        with open(arquivo, "w", encoding="utf-8") as f:
            json.dump(itens, f, ensure_ascii=False, indent=4)

        # Manter apenas os 5 backups mais recentes
        backups = sorted(BACKUP_DIR.glob("faq_backup_*.json"))
        if len(backups) > 5:
            for antigo in backups[:-5]:
                antigo.unlink()
                logger.info(f"Backup antigo removido: {antigo.name}")

        logger.info(f"Backup do FAQ realizado: {arquivo.name}")
        return True

    except Exception as e:
        logger.error(f"Erro ao fazer backup do FAQ: {e}")
        return False