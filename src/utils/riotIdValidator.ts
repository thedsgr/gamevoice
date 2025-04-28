/**
 * Valida o formato de um Riot ID.
 * @param riotId - O Riot ID a ser validado.
 * @returns `true` se o Riot ID for válido, caso contrário `false`.
 */
export function isValidRiotId(riotId: string): boolean {
  const riotIdRegex = /^[a-zA-Z0-9_]{3,16}#[a-zA-Z0-9]{2,5}$/;
  return riotIdRegex.test(riotId);
}