import { db } from '../utils/db.js';
import { Client, VoiceChannel, Guild, GuildMember } from 'discord.js';
import { getTeamFromRiotAPI } from '../utils/riotAPI.js';
import { movePlayersToTeamRooms } from '../utils/discordUtils.js';
import { TeamPlayers, Match, TeamData } from '../utils/match.d.js';

// Configurações
const EMPTY_CHANNEL_TIMEOUT = 60 * 1000; // 1 minuto
const MONITOR_INTERVAL = 10 * 1000; // 10 segundos

/**
 * Retorna estatísticas de uso do bot
 */
export function getBotStatistics() {
  const data = db.data;
  if (!data) return {};

  const now = Date.now();
  const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000;

  return {
    activeUsers: data.users.filter(user => 
      (user.lastInteraction ?? 0) > twentyFourHoursAgo
    ).length || 0,
    totalMatches: data.stats.totalMatchesCreated || 0,
    inactiveMatches: data.stats.totalMatchesEndedByInactivity || 0,
    reports: data.reports.length || 0,
    kicksByReports: data.stats.playersKickedByReports || 0,
    linkedAccounts: data.users.filter(user => 
      (user.riotAccounts?.length ?? 0) > 0
    ).length || 0,
    currentPlayers: data.matches.find(match => 
      match.isActive
    )?.players.length || 0,
    recentErrors: data.errors.filter(error => 
      error.timestamp > twentyFourHoursAgo
    ).map(error => ({
      time: new Date(error.timestamp).toLocaleTimeString(),
      message: error.message
    })) || []
  };
}

/**
 * Monitora e limpa canais de voz vazios
 */
export function setupEmptyChannelMonitor(client: Client) {
  async function monitorChannels() {
    try {
      const activeMatches = db.data?.matches.filter(match => match.isActive) || [];
      for (const match of activeMatches) {
        const channel = client.channels.cache.get(match.channelId) as VoiceChannel;
        if (!channel?.members?.size) {
          const inactiveTime = Date.now() - (match.lastActivity || Date.now());
          if (inactiveTime >= EMPTY_CHANNEL_TIMEOUT) {
            await handleEmptyChannel(channel, match);
          }
        }
      }
    } catch (error) {
      console.error('Erro no monitoramento de canais:', error);
      logError(error);
    } finally {
      setTimeout(monitorChannels, MONITOR_INTERVAL);
    }
  }
  monitorChannels();
}

async function handleEmptyChannel(channel: VoiceChannel, match: Match) {
  try {
    await channel.delete();
    console.log(`🗑️ Canal ${channel.name} excluído por inatividade`);
    
    match.isActive = false;
    db.data!.stats.totalMatchesEndedByInactivity++;
    await db.write();
  } catch (error) {
    console.error("Erro ao excluir canal:", error);
    logError(error);
  }
}

/**
 * Monitora partidas na API da Riot
 */
export async function monitorRiotMatches(guild: Guild, waitingRoomId: string) {
  const waitingRoom = guild.channels.cache.get(waitingRoomId) as VoiceChannel;

  if (!waitingRoom?.members?.size) {
    console.log('Sala de espera vazia');
    return;
  }

  try {
    const players = Array.from(waitingRoom.members.values());
    const teamData = await fetchTeamData(players);

    if (teamData?.teamPlayers?.length) {
      await processTeamData(guild, waitingRoom, teamData);
    }
  } catch (error) {
    console.error('Erro no monitoramento da Riot API:', error);
    logError(error);
  }
}

async function fetchTeamData(players: GuildMember[]): Promise<TeamData | null> {
  const summonerNames = players.map(player => player.displayName);
  const teamData = await getTeamFromRiotAPI(summonerNames);
  if (!teamData?.teamPlayers?.length) {
    console.log('Nenhuma partida ativa encontrada');
    return null;
  }

  const mappedPlayers = teamData.teamPlayers.map(player => {
    const discordMember = players.find(p => p.displayName.includes(player.riotName));
    return {
      ...player,
      discordId: discordMember?.id || '',
      puuid: player.puuid || ''
    };
  });

  return { ...teamData, matchId: teamData.matchId || '', teamPlayers: mappedPlayers };
}

async function processTeamData(guild: Guild, waitingRoom: VoiceChannel, teamData: TeamData) {
  if (!teamData.matchId) {
    console.error('ID de partida inválido');
    return;
  }

  console.log(`Partida detectada (ID: ${teamData.matchId})`);
  await movePlayersToTeamRooms(guild, waitingRoom, {
    teamPlayers: teamData.teamPlayers.map((TeamPlayers: TeamPlayers) => ({
      puuid: TeamPlayers.puuid || '', // Ensure puuid is present
      riotName: TeamPlayers.riotName,
      discordId: TeamPlayers.discordId || ''
    })),
    matchId: teamData.matchId
  });
}

function logError(error: unknown) {
  if (!db.data) return;
  
  db.data.errors.push({
    timestamp: Date.now(),
    message: error instanceof Error ? error.message : String(error)
  });
  
  db.write().catch(err => 
    console.error('Erro ao registrar erro:', err)
  );
}

export async function getActiveUsers(): Promise<number> {
  const data = db.data;
  if (!data) return 0;

  const now = Date.now();
  const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000;

  return data.users.filter(user => 
    (user.lastInteraction ?? 0) > twentyFourHoursAgo
  ).length || 0;
}