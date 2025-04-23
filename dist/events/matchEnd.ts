// src/events/matchEnd.ts
import { ExtendedClient } from "../structs/ExtendedClient.js";
import { endMatch, getMatchById } from "../services/match.js";

/**
 * Evento para encerrar uma partida.
 * @param matchId - O ID da partida a ser encerrada.
 * @param client - O cliente do bot.
 */
export default async function matchEnd(matchId: string, client: ExtendedClient): Promise<void> {
  try {
    console.log(`🏁 Encerrando a partida ${matchId}...`);

    // Busca os dados da partida usando a função de services/match.ts
    const match = getMatchById(matchId);
    if (!match) {
      console.warn(`⚠️ Partida ${matchId} não encontrada no banco de dados.`);
      return;
    }

    // Realiza ações de limpeza para a partida
    for (const playerId of match.players) {
      const member = findMemberInGuilds(client, playerId);
      if (member) {
        console.log(`👋 Removendo jogador ${member.user.tag} da partida ${matchId}.`);
        // Opcional: Enviar mensagem ao jogador ou realizar outras ações
      }
    }

    // Encerra a partida usando a função de services/match.ts
    await endMatch(matchId, client.user?.id || "unknown");
    console.log(`✅ Partida ${matchId} encerrada com sucesso.`);
  } catch (error) {
    console.error(`❌ Erro ao encerrar a partida ${matchId}:`, error);
  }
}

/**
 * Busca um membro em todos os servidores do bot.
 * @param client - O cliente do bot.
 * @param playerId - O ID do jogador.
 * @returns O membro encontrado ou null.
 */
function findMemberInGuilds(client: ExtendedClient, playerId: string) {
  for (const guild of client.guilds.cache.values()) {
    const member = guild.members.cache.get(playerId);
    if (member) return member;
  }
  return null;
}
