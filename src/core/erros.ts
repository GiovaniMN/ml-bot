import { logger } from './logger';
import { alertarErroPorEmail } from '../notificacao/email';

export async function reportarErro(erro: unknown, contexto = ''): Promise<void> {
  const tipo = erro instanceof Error ? erro.constructor.name : 'Error';
  const mensagem = erro instanceof Error ? erro.message : String(erro);
  const stack = erro instanceof Error ? (erro.stack ?? '') : '';

  const resumo = `${contexto} — ${tipo}: ${mensagem}`;

  logger.error({ contexto, tipo, stack }, resumo);

  await alertarErroPorEmail(resumo, stack);
}
