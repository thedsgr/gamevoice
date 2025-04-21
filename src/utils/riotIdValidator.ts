/**
 * Valida o formato do Riot ID.
 * O formato esperado é `Nome#1234`, onde:
 * - `Nome` tem entre 3 e 16 caracteres alfanuméricos.
 * - `#1234` tem entre 3 e 5 caracteres alfanuméricos.
 *
 * Exemplos válidos:
 * - "PlayerOne#1234"
 * - "Test123#999"
 *
 * Exemplos inválidos:
 * - "PlayerOne1234" (falta o `#`)
 * - "Pl#12" (muito curto)
 *
 * @param riotId - O Riot ID a ser validado.
 * @returns `true` se o formato for válido, caso contrário `false`.
 */
export function isValidRiotId(riotId: string): boolean {
  const riotIdRegex = /^[a-zA-Z0-9]{3,16}#[a-zA-Z0-9]{3,5}$/;

  const isValid = riotIdRegex.test(riotId);

  if (!isValid) {
    console.warn(`⚠️ Riot ID inválido: "${riotId}"`);
  }

  return isValid;
}