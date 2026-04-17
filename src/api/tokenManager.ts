import { config } from '../core/config';
import { logger } from '../core/logger';
import { salvarEnv } from '../core/envManager';

export async function renovarToken(): Promise<boolean> {
  logger.info('Renovando token ML...');

  try {
    const response = await fetch('https://api.mercadolibre.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: config.APP_ID,
        client_secret: config.SECRET_KEY,
        refresh_token: config.REFRESH_TOKEN,
      }),
    });

    const dados = (await response.json()) as Record<string, unknown>;

    if (typeof dados.access_token === 'string') {
      process.env['ACCESS_TOKEN'] = dados.access_token;
      process.env['REFRESH_TOKEN'] = dados.refresh_token as string;

      salvarEnv({ ACCESS_TOKEN: dados.access_token, REFRESH_TOKEN: dados.refresh_token as string });

      logger.info('Token renovado com sucesso');
      return true;
    } else {
      logger.error({ resposta: dados }, 'Erro ao renovar token ML');
      return false;
    }
  } catch (err) {
    logger.error({ err }, 'Falha na requisição de renovação de token');
    return false;
  }
}
