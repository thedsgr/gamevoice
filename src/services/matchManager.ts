/**
 * Gerencia o ciclo de vida completo das partidas e os canais relacionados.
 */
import { Guild, VoiceChannel, GuildMember, ChannelType, Client } from 'discord.js';
import { Logger } from '../utils/log.js';
import { getLinkedRiotId } from '../services/users.js';
import { monitorLobby } from './matchMonitor.js';
import { fetchActiveGame, fetchRiotAccount } from '../utils/riotAPI.js';
import { MatchType } from '../types/match.d.js';

const logger = new Logger();
const activeMatches = new Map<string, MatchData>();
function getVoiceChannels(guild: Guild): VoiceChannel[] {
  return [...guild.channels.cache.filter((c): c is VoiceChannel => c.type === ChannelType.GuildVoice).values()];
}

interface MatchData {
  guild: Guild;
  lobbyChannel: VoiceChannel;
  teamChannels: VoiceChannel[];
  players: GuildMember[];
  matchType: MatchType; // Adiciona o tipo de partida
  checkInterval: NodeJS.Timeout;
  createdAt: number;
}

/* ==========================
   Gerenciamento de Partidas
   ========================== */

/**
 * Valida se os jogadores estão na mesma partida ativa.
 */
export async function validatePlayersInSameMatch(
  players: { discordId: string; summonerId: string }[]
): Promise<{ matchId: string } | null> {
  try {
    if (players.length < 2) {
      Logger.debug('Número insuficiente de jogadores para validar partida');
      return null;
    }

    // TODO: Implementar lógica real de verificação
    return { matchId: `match_${Date.now()}` };
  } catch (error) {
    Logger.error('Falha na validação da partida:', error as Error);
    return null;
  }
}

/**
 * Inicia o gerenciamento de uma nova partida.
 */
export async function startMatch(
  guild: Guild,
  lobbyChannel: VoiceChannel,
  players: GuildMember[]
): Promise<string | null> {
  if (players.length < 2) {
    Logger.info('Mínimo de 2 jogadores necessário para iniciar partida');
    return null;
  }

  try {
    Logger.info(`Iniciando partida com ${players.length} jogadores no lobby: ${lobbyChannel.name}`);

    const stopMonitoring = monitorLobby(guild.client, lobbyChannel.id, async (updatedPlayers) => {
      Logger.info(`Jogadores atualizados no lobby: ${updatedPlayers.map(p => p.user.tag).join(', ')}`);

      if (updatedPlayers.length >= 2) {
        Logger.info('Condições atendidas para iniciar a partida');
        stopMonitoring();

        const riotAccounts = await Promise.all(
          updatedPlayers.map(async (p) => {
            const riotId = await getLinkedRiotId(p.id).catch(() => null);
            if (!riotId) {
              Logger.warn(`Jogador ${p.user.tag} não possui conta Riot vinculada.`);
              return null;
            }

            try {
              const riotAccount = await fetchRiotAccount(riotId);
              Logger.info(`Conta Riot encontrada para ${p.user.tag}: ${riotAccount.puuid}`);
              return { discordId: p.id, summonerId: riotAccount.puuid };
            } catch (error) {
              Logger.error(`Erro ao buscar Summoner ID para Riot ID: ${riotId}`, error instanceof Error ? error : new Error(String(error)));
              return null;
            }
          })
        );

        const validPlayers = updatedPlayers.filter((p) => p.voice.channel).map((p) => p as GuildMember);
        if (validPlayers.length < 2) {
          Logger.info('Número insuficiente de jogadores com canais de voz válidos');
          return;
        }

        const matchInfo = await validatePlayersInSameMatch(riotAccounts.filter((account) => account !== null) as { discordId: string; summonerId: string }[]);
        if (!matchInfo) {
          Logger.warn('Jogadores não estão na mesma partida ativa.');
          return;
        }

        Logger.info(`Partida iniciada com ID: ${matchInfo.matchId}`);
      }
    });

    return null;
  } catch (error) {
    Logger.error('Falha ao iniciar partida:', error as Error);
    return null;
  }
}

/**
 * Verifica o status da partida.
 */
async function checkMatchStatus(matchId: string): Promise<void> {
  const matchData = activeMatches.get(matchId);
  if (!matchData) return;

  try {
    const matchDuration = Date.now() - matchData.createdAt;
    if (matchDuration > 3600000) {
      await endMatch(matchId);
    }
  } catch (error) {
    Logger.error(`Erro ao verificar partida ${matchId}:`, error as Error);
  }
}

/**
 * Finaliza uma partida.
 */
export async function endMatch(matchId: string): Promise<boolean> {
  const matchData = activeMatches.get(matchId);
  if (!matchData) return false;

  try {
    clearInterval(matchData.checkInterval);
    await movePlayersToLobby(matchData);
    await cleanupChannels(matchData.teamChannels);
    activeMatches.delete(matchId);
    Logger.info(`Partida finalizada: ${matchId}`);
    return true;
  } catch (error) {
    Logger.error(`Erro ao finalizar partida ${matchId}:`, error as Error);
    return false;
  }
}

/* ==========================
   Gerenciamento de Canais
   ========================== */

/**
 * Cria canais de voz para os times.
 */
async function createTeamChannels(guild: Guild): Promise<[VoiceChannel, VoiceChannel]> {
  const category = await getOrCreateCategory(guild);
  const team1 = await guild.channels.create({
    name: 'Time 1',
    type: ChannelType.GuildVoice, // Especifica explicitamente que é um canal de voz
    parent: category.id,
    userLimit: 5
  }) as VoiceChannel; // Garante que o TypeScript trate como VoiceChannel

  const team2 = await guild.channels.create({
    name: 'Time 2',
    type: ChannelType.GuildVoice, // Especifica explicitamente que é um canal de voz
    parent: category.id,
    userLimit: 5
  }) as VoiceChannel;

  return [team1, team2];
}

/**
 * Move jogadores para os canais de times.
 */
async function movePlayersToTeams(
  players: GuildMember[],
  team1: VoiceChannel,
  team2: VoiceChannel
): Promise<void> {
  if (players.length <= 5) {
    Logger.warn('Número insuficiente de jogadores para formar dois times. Movendo todos para o Time 1.');
    await Promise.all(players.map(p => p.voice.setChannel(team1)));
    return;
  }

  const half = Math.ceil(players.length / 2);
  const team1Players = players.slice(0, half);
  const team2Players = players.slice(half);

  await Promise.all([
    ...team1Players.map(p => p.voice.setChannel(team1)),
    ...team2Players.map(p => p.voice.setChannel(team2))
  ]);
}

/**
 * Move jogadores de volta para o lobby.
 */
async function movePlayersToLobby(matchData: MatchData): Promise<void> {
  const { guild, teamChannels, lobbyChannel } = matchData;

  for (const channel of teamChannels) {
    const members = [...channel.members.values()];
    for (const member of members) {
      try {
        await member.voice.setChannel(lobbyChannel);
      } catch (error) {
        Logger.error(
          `Erro ao mover jogador ${member.user.tag} para o lobby:`,
          error as Error
        );
      }
    }
  }
}

/**
 * Limpa os canais de times.
 */
async function cleanupChannels(channels: VoiceChannel[]): Promise<void> {
  await Promise.all(channels.map(channel => channel.delete()));
}

/**
 * Obtém ou cria a categoria de canais para partidas.
 */
async function getOrCreateCategory(guild: Guild): Promise<any> {
  const categoryId = '1364647928089542667';
  const category = guild.channels.cache.get(categoryId);

  if (category && category.type === 4) {
    return category;
  }

  throw new Error(`Categoria com ID ${categoryId} não encontrada. Certifique-se de que a categoria existe.`);
}

/**
 * Processa os canais de voz.
 */
async function processVoiceChannels(guild: Guild): Promise<void> {
  const voiceChannels = guild.channels.cache.filter(
    (c): c is VoiceChannel => c.type === ChannelType.GuildVoice
  );

  console.log(voiceChannels);
}

/**
 * Monitora o status dos jogadores no League of Legends e gerencia o ciclo de vida das partidas.
 */
export async function monitorPlayerStatus(guild: Guild, lobbyChannel: VoiceChannel): Promise<void> {
  const players = Array.from(lobbyChannel.members.values());

  Logger.info(`Monitorando status dos jogadores no lobby ${lobbyChannel.name}.`);

  for (const player of players) {
    const riotId = await getLinkedRiotId(player.id);
    if (!riotId) continue;

    Logger.info(`Monitorando status do jogador ${player.user.tag} no lobby.`);

    try {
      Logger.debug(`Verificando status do jogador ${player.user.tag} com Riot ID: ${riotId}`);
      const activeGame = await fetchActiveGame(riotId, player.id);

      if (activeGame) {
        Logger.info(`Jogador ${player.user.tag} está em uma partida ativa. Movendo para o canal do time.`);
        const [team1Channel, team2Channel] = await createTeamChannels(guild);
        await movePlayersToTeams([player], team1Channel, team2Channel);

        const interval = setInterval(async () => {
          const gameStatus = await fetchActiveGame(riotId, player.id);
          if (!gameStatus) {
            Logger.debug(`Jogador ${player.user.tag} não está em uma partida ativa.`);
            clearInterval(interval);
            await movePlayersToLobby({
              guild,
              teamChannels: [team1Channel, team2Channel],
              lobbyChannel,
              players: [],
              matchType: MatchType.CUSTOM,
              checkInterval: setInterval(() => {}, 0),
              createdAt: Date.now()
            });
            await cleanupChannels([team1Channel, team2Channel]);
          }
        }, 30000);
      }
    } catch (error) {
      Logger.error(`Erro ao monitorar status do jogador ${player.user.tag}:`, error instanceof Error ? error : new Error(String(error)));
    }
  }
}

/**
 * Move um jogador para o canal de voz do time correspondente.
 * @param playerId - O ID do jogador no Discord.
 * @param gameId - O ID da partida.
 */
export async function moveToTeamVoiceChannel(playerId: string, gameId: string): Promise<void> {
  try {
    // Obtém a guilda do cliente (substitua pelo ID correto da guilda)
    const client = new Client({ intents: [] }); // Certifique-se de usar o cliente correto
    const guild = client.guilds.cache.get(process.env.GUILD_ID!);

    if (!guild) {
      throw new Error(`Guilda com ID ${process.env.GUILD_ID} não encontrada.`);
    }

    const member = guild.members.cache.get(playerId);

    if (!member) {
      throw new Error(`Jogador com ID ${playerId} não encontrado.`);
    }

    // Determina o canal do time com base no gameId (exemplo simplificado)
    const teamChannel = guild.channels.cache.find(
      (channel) => channel.name === `Time-${gameId}` && channel.isVoiceBased()
    ) as VoiceChannel | undefined;

    if (!teamChannel) {
      throw new Error(`Canal de voz para o jogo ${gameId} não encontrado.`);
    }

    await member.voice.setChannel(teamChannel);
    Logger.info(`Jogador ${member.user.tag} movido para o canal do time no jogo ${gameId}.`);
  } catch (error) {
    Logger.error(`Erro ao mover jogador para o canal do time:`, error as Error);
    throw error;
  }
}

// Ensure MatchManager is defined and exported
export class MatchManager {
  // Class implementation

  static async forceStartMatch(guild: any): Promise<void> {
    // Logic to force start a match
    console.log(`Force starting a match for guild: ${guild.id}`);
    // Add your implementation here
  }

  static async forceEndAllMatches(guild: any): Promise<void> {
    // Implement logic to forcefully end all matches for the given guild
    console.log(`Forcefully ending all matches for guild: ${guild.id}`);
    // Add your logic here
  }
}

