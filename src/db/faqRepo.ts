import { prisma } from './client';

export interface FaqItemDto {
  id: number;
  perguntas: string[];
  resposta: string;
}

export const faqRepo = {
  async carregar(): Promise<FaqItemDto[]> {
    const itens = await prisma.faqItem.findMany({ orderBy: { id: 'asc' } });
    return itens.map((item) => ({
      id: item.id,
      perguntas: JSON.parse(item.perguntas) as string[],
      resposta: item.resposta,
    }));
  },

  async adicionar(perguntas: string[], resposta: string): Promise<void> {
    await prisma.faqItem.create({
      data: {
        perguntas: JSON.stringify(perguntas),
        resposta,
      },
    });
  },

  async remover(id: number): Promise<void> {
    await prisma.faqItem.delete({ where: { id } });
  },

  async buscarPorPalavraChave(mensagem: string): Promise<string | null> {
    const texto = mensagem.toLowerCase();
    const itens = await this.carregar();
    for (const item of itens) {
      if (item.perguntas.some((p) => texto.includes(p))) {
        return item.resposta;
      }
    }
    return null;
  },
};
