import db from '../utils/db';
import { fetchActiveGame, fetchSummonerId } from '../utils/riotAPI.js';

async function checkRiotId(riotId: string) {
  try {
    // Extrair o nome do invocador do Riot ID
    const [summonerName] = riotId.split('#');

    // Buscar o Summoner ID usando o nome do invocador
    const summonerId = await fetchSummonerId(summonerName);
    if (!summonerId) {
      console.error('Summoner ID não encontrado para o Riot ID fornecido.');
      return;
    }

    console.log(`Summoner ID encontrado: ${summonerId}`);

    // Verificar se o jogador está em partida
    const activeGame = await fetchActiveGame(summonerId);
    if (activeGame) {
      console.log(`O jogador está em uma partida ativa:`, activeGame);
    } else {
      console.log(`O jogador não está em uma partida ativa.`);
    }
  } catch (error) {
    console.error('Erro ao verificar Riot ID:', error);
  } finally {
    await db.destroy();
  }
}

// Substitua 'ID_ESPECIFICO' pelo Riot ID que deseja verificar
const riotId = 'Jhin#9056';
checkRiotId(riotId);