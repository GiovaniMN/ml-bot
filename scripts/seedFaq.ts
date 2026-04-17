/**
 * Seed inicial do FAQ no banco de dados SQLite.
 * Uso: npm run db:seed
 */
import '../src/core/config'; // carrega .env
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const FAQ_INICIAL = [
  {
    perguntas: ['prazo', 'entrega', 'quando chega', 'demora', 'dias'],
    resposta:
      '🚚 O prazo de entrega varia de 3 a 10 dias úteis dependendo da sua região. Você pode acompanhar pelo rastreamento no seu pedido.',
  },
  {
    perguntas: ['garantia', 'defeito', 'quebrou', 'problema', 'estragou'],
    resposta:
      '🛡️ Todos os nossos produtos possuem garantia de fábrica. Em caso de defeito, entre em contato em até 90 dias para acionarmos a garantia.',
  },
  {
    perguntas: ['troca', 'devolver', 'devolução', 'arrependimento'],
    resposta:
      '🔄 Você tem até 7 dias corridos após o recebimento para solicitar troca ou devolução, conforme o Código de Defesa do Consumidor.',
  },
  {
    perguntas: ['nota fiscal', 'nf', 'nota', 'fiscal'],
    resposta:
      '🧾 A nota fiscal é enviada junto com o produto ou por e-mail em até 24h após a confirmação do pagamento.',
  },
  {
    perguntas: ['pagamento', 'pagar', 'boleto', 'pix', 'cartão'],
    resposta:
      '💳 Aceitamos todas as formas de pagamento disponíveis no Mercado Livre: cartão de crédito, boleto, Pix e Mercado Pago.',
  },
  {
    perguntas: ['voltagem', 'bivolt', '110', '220', 'tensão'],
    resposta:
      '⚡ A voltagem do produto está especificada no anúncio. A maioria dos nossos produtos é bivolt (110/220V).',
  },
];

async function seed() {
  console.log('🌱 Verificando banco de dados...');

  const total = await prisma.faqItem.count();
  if (total > 0) {
    console.log(`ℹ️  Banco já possui ${total} entradas — seed pulado.`);
    return;
  }

  console.log('📝 Inserindo FAQ inicial...');
  for (const item of FAQ_INICIAL) {
    await prisma.faqItem.create({
      data: {
        perguntas: JSON.stringify(item.perguntas),
        resposta: item.resposta,
      },
    });
    console.log(`  ✅ ${item.perguntas[0]}...`);
  }

  console.log(`\n✅ ${FAQ_INICIAL.length} entradas inseridas com sucesso!`);
}

seed()
  .catch((err) => {
    console.error('❌ Erro no seed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
