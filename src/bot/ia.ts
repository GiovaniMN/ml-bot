import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../core/config';
import { logger } from '../core/logger';
import type { FaqItemDto } from '../db/faqRepo';

// Inicializa o cliente Gemini (lazy — só se a API key estiver configurada)
function getGemini(modelName: string) {
  if (!config.GEMINI_API_KEY) return null;
  const genai = new GoogleGenerativeAI(config.GEMINI_API_KEY);
  return genai.getGenerativeModel({ model: modelName });
}

const INTENCOES_VALIDAS = ['status_pedido', 'faq', 'transferir', 'saudacao'] as const;
type Intencao = (typeof INTENCOES_VALIDAS)[number];

const PROMPT_INTENCAO = `Você é um classificador de intenções para um bot de atendimento
de uma loja de eletrônicos no Mercado Livre chamada Jupiter_eletro.

Classifique a mensagem do cliente em UMA dessas categorias:
- status_pedido: cliente quer saber sobre pedido, entrega, rastreio, envio, onde está
- faq: dúvida sobre garantia, troca, devolução, pagamento, nota fiscal, voltagem, prazo
- transferir: quer falar com humano, vendedor, atendente, pessoa real
- saudacao: oi, olá, bom dia, boa tarde, boa noite, cumprimentos

Responda APENAS com o nome da categoria, sem explicações, sem pontuação.`;

const PROMPT_FAQ_SISTEMA = `Você é um assistente de atendimento ao cliente da loja de eletrônicos Jupiter Eletro no Mercado Livre. Seu tom é profissional, amigável e direto.

Abaixo está a Base de Conhecimento da loja com todas as informações disponíveis:

{contexto_faq}

---
INSTRUÇÕES:
1. Responda à pergunta do cliente usando APENAS as informações da Base de Conhecimento acima.
2. Seja conciso e claro. Máximo de 3 frases.
3. Use linguagem natural e conversacional, sem bullet points ou markdown.
4. Se a pergunta não puder ser respondida com base no contexto acima, responda EXATAMENTE com a palavra: ESCALAR
5. Não invente informações que não estejam na Base de Conhecimento.

Pergunta do cliente: {pergunta}`;

// ─── Helper: chama o Gemini e retorna o texto ou null ────────────────────────

async function chamarGemini(prompt: string, modelName: string): Promise<string | null> {
  try {
    const model = getGemini(modelName);
    if (!model) return null;
    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (err) {
    logger.warn({ err, model: modelName }, `Falha no modelo ${modelName}`);
    return null;
  }
}

// ─── Detecção de intenção ────────────────────────────────────────────────────

async function detectarIntencaoGemini(
  texto: string,
  modelName: string
): Promise<Intencao | null> {
  const prompt = `${PROMPT_INTENCAO}\n\nMensagem do cliente: ${texto}`;
  const resultado = await chamarGemini(prompt, modelName);

  if (resultado && (INTENCOES_VALIDAS as readonly string[]).includes(resultado.toLowerCase())) {
    const intencao = resultado.toLowerCase() as Intencao;
    logger.info({ model: modelName, intencao, texto: texto.slice(0, 50) }, 'Intenção detectada por IA');
    return intencao;
  }

  logger.warn({ model: modelName, resposta: resultado }, 'IA retornou intenção inválida');
  return null;
}

export async function detectarIntencaoComFallback(texto: string): Promise<Intencao | null> {
  if (!config.GEMINI_API_KEY) {
    logger.warn('GEMINI_API_KEY não configurada');
    return null;
  }

  // Camada 1 — Gemini Flash-Lite (gratuito, mais rápido)
  const intencao1 = await detectarIntencaoGemini(texto, 'gemini-2.0-flash-lite');
  if (intencao1) return intencao1;

  // Camada 2 — Gemini Flash (fallback automático)
  logger.info('Fallback de intenção para Gemini Flash');
  return detectarIntencaoGemini(texto, 'gemini-2.0-flash');
}

// ─── Geração de resposta FAQ (RAG) ───────────────────────────────────────────

async function gerarRespostaFaq(
  pergunta: string,
  itensFaq: FaqItemDto[],
  modelName: string
): Promise<string | null> {
  if (!itensFaq.length) return null;

  const contextoFaq = itensFaq
    .map((item, i) => {
      const palavras = item.perguntas.join(', ');
      return `[${i + 1}] Palavras-chave: ${palavras}\n    Informação: ${item.resposta}`;
    })
    .join('\n\n');

  const prompt = PROMPT_FAQ_SISTEMA.replace('{contexto_faq}', contextoFaq).replace(
    '{pergunta}',
    pergunta
  );

  const resultado = await chamarGemini(prompt, modelName);

  if (resultado === null) return null;
  if (resultado.toUpperCase().includes('ESCALAR')) {
    logger.info({ texto: pergunta.slice(0, 50) }, 'IA sinalizou escalar para humano');
    return null;
  }

  logger.info({ model: modelName, texto: pergunta.slice(0, 50) }, 'Resposta FAQ gerada por IA');
  return resultado;
}

export async function gerarRespostaFaqComFallback(
  pergunta: string,
  itensFaq: FaqItemDto[]
): Promise<string | null> {
  if (!config.GEMINI_API_KEY) return null;

  // Camada 1 — Flash-Lite
  const r1 = await gerarRespostaFaq(pergunta, itensFaq, 'gemini-2.0-flash-lite');
  if (r1) return r1;

  // Camada 2 — Flash
  logger.info('Fallback de resposta FAQ para Gemini Flash');
  return gerarRespostaFaq(pergunta, itensFaq, 'gemini-2.0-flash');
}
