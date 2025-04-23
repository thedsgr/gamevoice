import { endMatch, getMatchById } from "../services/match.js";
import { findMemberInGuilds } from "../utils/members.js";
/**
 * Evento para encerrar uma partida.
 * @param matchId - O ID da partida a ser encerrada.
 * @param client - O cliente do bot.
 */
export default async function matchEnd(matchId, client) {
    try {
        console.log(`🏁 Encerrando a partida ${matchId}...`);
        // Busca os dados da partida
        const match = getMatchById(matchId);
        if (!match) {
            console.warn(`⚠️ Partida ${matchId} não encontrada no banco de dados.`);
            return;
        }
        // Realiza ações de limpeza para a partida
        await cleanUpMatchPlayers(match.players, matchId, client);
        // Encerra a partida
        await endMatch(matchId, client.user?.id || "unknown");
        console.log(`✅ Partida ${matchId} encerrada com sucesso.`);
    }
    catch (error) {
        console.error(`❌ Erro ao encerrar a partida ${matchId}:`, error);
    }
}
/**
 * Realiza ações de limpeza para os jogadores de uma partida.
 * @param players - IDs dos jogadores.
 * @param matchId - O ID da partida.
 * @param client - O cliente do bot.
 */
async function cleanUpMatchPlayers(players, matchId, client) {
    for (const playerId of players) {
        const member = findMemberInGuilds(client, playerId);
        if (member) {
            console.log(`👋 Removendo jogador ${member.user.tag} da partida ${matchId}.`);
            // Opcional: Enviar mensagem ao jogador ou realizar outras ações
        }
    }
}
