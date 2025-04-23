import { ExtendedClient } from "../structs/ExtendedClient.js";

/**
 * Busca um membro em todos os servidores do bot.
 * @param client - O cliente do bot.
 * @param playerId - O ID do jogador.
 * @returns O membro encontrado ou null.
 */
export function findMemberInGuilds(client: ExtendedClient, playerId: string) {
  for (const guild of client.guilds.cache.values()) {
    const member = guild.members.cache.get(playerId);
    if (member) return member;
  }
  return null;
}