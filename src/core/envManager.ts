import { readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { logger } from './logger';

const ENV_PATH = path.join(process.cwd(), '.env');

/** Lê todas as chaves do arquivo .env */
export function lerEnv(): Record<string, string> {
  const conteudo = readFileSync(ENV_PATH, 'utf-8');
  const resultado: Record<string, string> = {};
  for (const linha of conteudo.split(/\r?\n/)) {
    const trimmed = linha.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    const chave = trimmed.slice(0, idx).trim();
    const valor = trimmed.slice(idx + 1).trim().replace(/^['"]|['"]$/g, '');
    resultado[chave] = valor;
  }
  return resultado;
}

/**
 * Atualiza chaves no arquivo .env e em process.env.
 * Entradas com valor vazio são ignoradas (mantém valor atual).
 */
export function salvarEnv(atualizacoes: Record<string, string>): void {
  let conteudo = readFileSync(ENV_PATH, 'utf-8');

  for (const [chave, valor] of Object.entries(atualizacoes)) {
    if (valor === '') continue; // não sobrescreve com valor vazio

    const regex = new RegExp(`^${chave}=.*$`, 'm');
    if (regex.test(conteudo)) {
      conteudo = conteudo.replace(regex, `${chave}=${valor}`);
    } else {
      conteudo += `\n${chave}=${valor}`;
    }
    process.env[chave] = valor;
  }

  writeFileSync(ENV_PATH, conteudo, 'utf-8');
  logger.info({ chaves: Object.keys(atualizacoes) }, '.env atualizado');
}
