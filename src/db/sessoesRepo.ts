import { prisma } from './client';
import { logger } from '../core/logger';

export const sessoesRepo = {
  async getEstado(conversaId: string): Promise<string> {
    const sessao = await prisma.sessao.findUnique({ where: { conversaId } });
    return sessao?.estado ?? 'ativo';
  },

  async setEstado(conversaId: string, estado: string, buyerId = ''): Promise<void> {
    await prisma.sessao.upsert({
      where: { conversaId },
      update: { estado, atualizadoEm: new Date() },
      create: { conversaId, estado, buyerId, atualizadoEm: new Date() },
    });
    logger.info({ conversaId, estado }, 'Sessão atualizada');
  },

  async estaAguardandoHumano(conversaId: string): Promise<boolean> {
    const estado = await this.getEstado(conversaId);
    return estado === 'aguardando_humano';
  },

  async liberarSessao(conversaId: string): Promise<void> {
    await prisma.sessao.delete({ where: { conversaId } });
    logger.info({ conversaId }, 'Sessão liberada — bot voltou a atender');
  },

  async listarAguardando(): Promise<Array<{ conversaId: string; buyerId: string | null }>> {
    const sessoes = await prisma.sessao.findMany({
      where: { estado: 'aguardando_humano' },
    });
    return sessoes.map((s) => ({ conversaId: s.conversaId, buyerId: s.buyerId }));
  },
};
