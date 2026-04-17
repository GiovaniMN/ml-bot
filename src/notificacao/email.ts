import nodemailer from 'nodemailer';
import { config } from '../core/config';
import { logger } from '../core/logger';

function criarTransporte() {
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: config.EMAIL_REMETENTE,
      pass: config.EMAIL_SENHA,
    },
  });
}

function emailConfigurado(): boolean {
  return !!(config.EMAIL_REMETENTE && config.EMAIL_SENHA && config.EMAIL_VENDEDOR);
}

export async function notificarVendedor(
  buyerId: string,
  conversaId: string,
  textoCliente: string
): Promise<boolean> {
  if (!emailConfigurado()) {
    logger.warn('Notificação de vendedor suprimida — e-mail não configurado');
    return false;
  }

  try {
    const transporte = criarTransporte();
    await transporte.sendMail({
      from: config.EMAIL_REMETENTE,
      to: config.EMAIL_VENDEDOR,
      subject: '🔔 Jupiter_eletro — Cliente aguardando atendimento',
      html: `
        <html><body style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="color: #FFE600;">🤖 Jupiter_eletro Bot</h2>
          <p>Um cliente solicitou atendimento humano e está aguardando.</p>
          <hr/>
          <table>
            <tr><td><b>ID do comprador:</b></td><td>${buyerId}</td></tr>
            <tr><td><b>ID da conversa:</b></td><td>${conversaId}</td></tr>
            <tr><td><b>Última mensagem:</b></td><td>${textoCliente}</td></tr>
          </table>
          <hr/>
          <p>Acesse o <a href="https://www.mercadolivre.com.br">Mercado Livre</a> para responder.</p>
        </body></html>
      `,
    });
    logger.info({ destinatario: config.EMAIL_VENDEDOR }, 'Notificação enviada ao vendedor');
    return true;
  } catch (err) {
    logger.error({ err }, 'Erro ao enviar notificação de vendedor');
    return false;
  }
}

export async function alertarErroPorEmail(mensagem: string, detalhe: string): Promise<void> {
  if (!emailConfigurado()) return;

  try {
    const transporte = criarTransporte();
    await transporte.sendMail({
      from: config.EMAIL_REMETENTE,
      to: config.EMAIL_VENDEDOR,
      subject: '🚨 Jupiter_eletro Bot — Erro crítico detectado',
      html: `
        <html><body style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="color: #e74c3c;">🚨 Erro crítico no Bot</h2>
          <p><b>Mensagem:</b> ${mensagem}</p>
          <hr/>
          <pre style="background:#f5f5f5;padding:12px;border-radius:6px;font-size:12px;">${detalhe}</pre>
        </body></html>
      `,
    });
    logger.info('Alerta de erro enviado por e-mail');
  } catch (err) {
    logger.error({ err }, 'Falha ao enviar alerta de erro por e-mail');
  }
}
