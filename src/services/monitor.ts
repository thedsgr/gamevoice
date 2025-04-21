import { db } from '../utils/db.js';
import { Client, VoiceChannel } from 'discord.js';

const EMPTY_CHANNEL_TIMEOUT = 60 * 1000; // 1 minuto

/**
 * Retorna o número de usuários ativos nas últimas 24 horas.
 */
export function getActiveUsers(): number {
  const now = Date.now();
  const activeUsers = db.data?.users.filter(user => now - (user.lastInteraction ?? 0) < 24 * 60 * 60 * 1000);
  return activeUsers?.length || 0;
}

/**
 * Retorna o total de partidas criadas.
 */
export function getTotalMatchesCreated(): number {
  return db.data?.stats.totalMatchesCreated || 0;
}

/**
 * Retorna o total de partidas encerradas por inatividade.
 */
export function getTotalMatchesEndedByInactivity(): number {
  return db.data?.stats.totalMatchesEndedByInactivity || 0;
}

/**
 * Retorna o total de denúncias registradas.
 */
export function getTotalReports(): number {
  return db.data?.reports.length || 0;
}

/**
 * Retorna o número de jogadores expulsos por denúncias.
 */
export function getPlayersKickedByReports(): number {
  return db.data?.stats.playersKickedByReports || 0;
}

/**
 * Retorna o número de usuários com Riot ID vinculado.
 */
export function getLinkedRiotIds(): number {
  const linkedUsers = db.data?.users.filter(user => user.riotId);
  return linkedUsers?.length || 0;
}

/**
 * Retorna o número de jogadores atualmente em partida.
 */
export function getPlayersInCurrentMatch(): number {
  const activeMatch = db.data?.matches.find(match => match.isActive);
  return activeMatch?.players.length || 0;
}

/**
 * Retorna os erros registrados nas últimas 24 horas.
 */
export function getRecentErrors(): string[] {
  const now = Date.now();
  const recentErrors = db.data?.errors.filter(error => now - error.timestamp < 24 * 60 * 60 * 1000);
  return recentErrors?.map(error => `${new Date(error.timestamp).toLocaleTimeString()} - ${error.message}`) || [];
}

/**
 * Monitora canais de voz vazios e os exclui após um período de inatividade.
 */
export function monitorEmptyChannels(client: Client) {
  setInterval(async () => {
    const now = Date.now();

    // Itera sobre os canais de voz ativos no banco de dados
    const activeMatches = db.data?.matches.filter(match => match.isActive) || [];
    for (const match of activeMatches) {
      const channel = client.channels.cache.get(match.channelId) as VoiceChannel;

      // Verifica se o canal está vazio
      if (channel && channel.members.size === 0) {
        const timeSinceLastActivity = now - (match.lastActivity || now);

        if (timeSinceLastActivity >= EMPTY_CHANNEL_TIMEOUT) {
          try {
            await channel.delete();
            console.log(`🗑️ Canal ${channel.name} excluído por inatividade.`);
            match.isActive = false;
            db.data!.stats.totalMatchesEndedByInactivity++;
            await db.write();
          } catch (err) {
            console.error("❌ Erro ao excluir canal de voz:", err);
          }
        }
      }
    }
  }, 10 * 1000); // Verifica a cada 10 segundos
}