/**
 * Sanitização de inputs de usuário.
 * Remove tags HTML, caracteres de controle e aplica limite de tamanho.
 */

export function sanitizarTexto(texto: string, limite = 500): string {
  if (!texto) return '';

  // Remover caracteres de controle (exceto \n e \t)
  texto = texto.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, '');

  // Remover tags HTML
  texto = texto.replace(/<[^>]+>/g, '');

  // Normalizar espaços múltiplos
  texto = texto.replace(/\s+/g, ' ').trim();

  // Aplicar limite de caracteres
  if (texto.length > limite) {
    texto = texto.slice(0, limite);
  }

  return texto;
}

export function sanitizarFaqPergunta(texto: string): string {
  return sanitizarTexto(texto, 200).toLowerCase();
}

export function sanitizarFaqResposta(texto: string): string {
  return sanitizarTexto(texto, 1000);
}
