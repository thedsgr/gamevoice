/**
 * Gera um ID único para a partida.
 * @returns ID único.
 */
export function generateMatchId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
}
