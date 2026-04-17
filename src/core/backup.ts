import { writeFileSync, mkdirSync, readdirSync, unlinkSync } from 'fs';
import path from 'path';
import { faqRepo } from '../db/faqRepo';
import { logger } from './logger';

const BACKUP_DIR = path.join(process.cwd(), 'backups');

export async function fazerBackupFaq(): Promise<boolean> {
  try {
    mkdirSync(BACKUP_DIR, { recursive: true });

    const itens = await faqRepo.carregar();
    const timestamp = new Date()
      .toISOString()
      .replace(/[T:]/g, '_')
      .replace(/\..+/, '');
    const arquivo = path.join(BACKUP_DIR, `faq_backup_${timestamp}.json`);

    writeFileSync(arquivo, JSON.stringify(itens, null, 2), 'utf-8');

    // Manter apenas os 5 backups mais recentes
    const backups = readdirSync(BACKUP_DIR)
      .filter((f) => f.startsWith('faq_backup_') && f.endsWith('.json'))
      .sort();

    if (backups.length > 5) {
      backups.slice(0, -5).forEach((b) => {
        unlinkSync(path.join(BACKUP_DIR, b));
        logger.info({ arquivo: b }, 'Backup antigo removido');
      });
    }

    logger.info({ arquivo: path.basename(arquivo) }, 'Backup do FAQ realizado');
    return true;
  } catch (err) {
    logger.error({ err }, 'Erro ao fazer backup do FAQ');
    return false;
  }
}
