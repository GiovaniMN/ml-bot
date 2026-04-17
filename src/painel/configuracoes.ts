import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import bcrypt from 'bcrypt';
import { estaLogado } from './auth';
import { logger } from '../core/logger';
import { lerEnv, salvarEnv } from '../core/envManager';
import { renovarToken } from '../api/tokenManager';

// ─── Helper: verifica se uma chave está configurada no .env atual ─────────────

function getStatus() {
  const env = lerEnv();
  const hasVal = (k: string) => !!env[k]?.trim();

  return {
    ml: hasVal('APP_ID') && hasVal('SECRET_KEY') && hasVal('USER_ID'),
    token: hasVal('ACCESS_TOKEN') && hasVal('REFRESH_TOKEN'),
    ia: hasVal('GEMINI_API_KEY'),
    email: hasVal('EMAIL_REMETENTE') && hasVal('EMAIL_SENHA') && hasVal('EMAIL_VENDEDOR'),
    painel: hasVal('PAINEL_SENHA_HASH'),
  };
}

// ─── Plugin de rotas de configurações ────────────────────────────────────────

export async function configuracoesPlugin(app: FastifyInstance): Promise<void> {
  // GET /painel/configuracoes
  app.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    if (!estaLogado(request)) return reply.redirect('/painel/login');

    const env = lerEnv();
    const query = request.query as Record<string, string>;

    return reply.view('configuracoes.ejs', {
      status: getStatus(),
      // Valores não-sigilosos para pré-preencher o formulário
      valores: {
        APP_ID: env['APP_ID'] ?? '',
        USER_ID: env['USER_ID'] ?? '',
        EMAIL_REMETENTE: env['EMAIL_REMETENTE'] ?? '',
        EMAIL_VENDEDOR: env['EMAIL_VENDEDOR'] ?? '',
        PAINEL_USUARIO: env['PAINEL_USUARIO'] ?? 'admin',
        PORT: env['PORT'] ?? '3000',
        NODE_ENV: env['NODE_ENV'] ?? 'development',
      },
      mensagem_sucesso: query['ok'] ?? null,
      mensagem_erro: query['erro'] ?? null,
    });
  });

  // POST /painel/configuracoes — salvar todas as seções em um único envio
  app.post('/', async (request: FastifyRequest, reply: FastifyReply) => {
    if (!estaLogado(request)) return reply.redirect('/painel/login');

    const body = request.body as Record<string, string>;
    const atualizacoes: Record<string, string> = {};

    // ── Mercado Livre ──────────────────────────────────────────────────────────
    if (body['APP_ID']?.trim()) atualizacoes['APP_ID'] = body['APP_ID'].trim();
    if (body['SECRET_KEY']?.trim()) atualizacoes['SECRET_KEY'] = body['SECRET_KEY'].trim();
    if (body['USER_ID']?.trim()) atualizacoes['USER_ID'] = body['USER_ID'].trim();
    if (body['ACCESS_TOKEN']?.trim()) atualizacoes['ACCESS_TOKEN'] = body['ACCESS_TOKEN'].trim();
    if (body['REFRESH_TOKEN']?.trim()) atualizacoes['REFRESH_TOKEN'] = body['REFRESH_TOKEN'].trim();

    // ── Gemini AI ─────────────────────────────────────────────────────────────
    if (body['GEMINI_API_KEY']?.trim()) atualizacoes['GEMINI_API_KEY'] = body['GEMINI_API_KEY'].trim();

    // ── Email ─────────────────────────────────────────────────────────────────
    if (body['EMAIL_REMETENTE']?.trim()) atualizacoes['EMAIL_REMETENTE'] = body['EMAIL_REMETENTE'].trim();
    if (body['EMAIL_SENHA']?.trim()) atualizacoes['EMAIL_SENHA'] = body['EMAIL_SENHA'].trim();
    if (body['EMAIL_VENDEDOR']?.trim()) atualizacoes['EMAIL_VENDEDOR'] = body['EMAIL_VENDEDOR'].trim();

    // ── Painel ────────────────────────────────────────────────────────────────
    if (body['PAINEL_USUARIO']?.trim()) atualizacoes['PAINEL_USUARIO'] = body['PAINEL_USUARIO'].trim();

    // Alteração de senha: hash bcrypt se os dois campos coincidirem
    const novaSenha = body['nova_senha']?.trim() ?? '';
    const confirmarSenha = body['confirmar_senha']?.trim() ?? '';

    if (novaSenha) {
      if (novaSenha !== confirmarSenha) {
        return reply.redirect('/painel/configuracoes?erro=As senhas não coincidem');
      }
      if (novaSenha.length < 6) {
        return reply.redirect('/painel/configuracoes?erro=A senha deve ter ao menos 6 caracteres');
      }
      atualizacoes['PAINEL_SENHA_HASH'] = await bcrypt.hash(novaSenha, 12);
      logger.info('Senha do painel alterada com sucesso');
    }

    if (Object.keys(atualizacoes).length === 0) {
      return reply.redirect('/painel/configuracoes?erro=Nenhuma alteração detectada — preencha ao menos um campo');
    }

    try {
      salvarEnv(atualizacoes);
      return reply.redirect('/painel/configuracoes?ok=Configurações salvas com sucesso!');
    } catch (err) {
      logger.error({ err }, 'Erro ao salvar .env');
      return reply.redirect('/painel/configuracoes?erro=Erro ao salvar as configurações');
    }
  });

  // POST /painel/configuracoes/renovar-token
  app.post('/renovar-token', async (request: FastifyRequest, reply: FastifyReply) => {
    if (!estaLogado(request)) return reply.redirect('/painel/login');

    const sucesso = await renovarToken();

    if (sucesso) {
      return reply.redirect('/painel/configuracoes?ok=Token ML renovado com sucesso!');
    } else {
      return reply.redirect(
        '/painel/configuracoes?erro=Falha ao renovar token — verifique APP_ID, SECRET_KEY e REFRESH_TOKEN'
      );
    }
  });
}
