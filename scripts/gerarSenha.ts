/**
 * Gera um hash bcrypt para uso como PAINEL_SENHA_HASH no .env
 * Uso: npm run senha
 */
import bcrypt from 'bcrypt';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question('Nova senha: ', async (senha) => {
  if (!senha.trim()) {
    console.error('❌ Senha não pode estar vazia.');
    process.exit(1);
  }

  const hash = await bcrypt.hash(senha, 12);
  console.log('\n✅ Hash gerado com sucesso!\n');
  console.log('Adicione no seu .env:');
  console.log(`PAINEL_SENHA_HASH=${hash}`);
  rl.close();
});
