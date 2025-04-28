/**
 * Monitora o estado do lobby e informa o matchManager sobre os jogadores disponíveis.
 */
import { Client, VoiceChannel, GuildMember, Collection, Guild } from 'discord.js';
import { Logger } from '../utils/log.js';
import { monitorPlayerStatus } from './matchManager';

const logger = new Logger();
const lobbyPlayers: Map<string, GuildMember> = new Map(); // Usar Map para manter referência aos membros

/**
 * Monitora quem entra ou sai do lobby e informa o matchManager.
 * @param client - Instância do cliente Discord.
 * @param lobbyChannelId - ID do canal de lobby.
 * @param onUpdate - Callback para informar mudanças no lobby.
 * @returns Função para parar o monitoramento.
 */
export function monitorLobby(
  client: Client,
  lobbyChannelId: string,
  onUpdate: (players: GuildMember[]) => void
): () => void { // Retorna função para parar o monitoramento
  const lobbyChannel = client.channels.cache.get(lobbyChannelId) as VoiceChannel;

  if (!lobbyChannel) {
    Logger.error('Canal de lobby não encontrado', new Error(`Channel ID: ${lobbyChannelId}`));
    return () => {};
  }

  Logger.info(`Monitorando o canal de lobby: ${lobbyChannel.name} (ID: ${lobbyChannelId})`);

  const interval = setInterval(() => {
    const currentMembers = lobbyChannel.members as Collection<string, GuildMember>; // Garante o tipo correto

    const updates = {
      joined: Array.from(currentMembers.values()).filter((m: GuildMember) => !lobbyPlayers.has(m.id)),
      left: Array.from(lobbyPlayers.keys()).filter((id: string) => !currentMembers.has(id))
    };

    // Atualiza estado
    updates.joined.forEach(m => {
      Logger.info(`Jogador entrou no lobby: ${m.user.tag}`);
      lobbyPlayers.set(m.id, m);
    });
    updates.left.forEach(id => {
      Logger.info(`Jogador saiu do lobby: ${lobbyPlayers.get(id)?.user.tag}`);
      lobbyPlayers.delete(id);
    });

    if (updates.joined.length || updates.left.length) {
      Logger.debug(`Atualização do lobby - Entraram: ${updates.joined.length}, Saíram: ${updates.left.length}`);
      onUpdate(Array.from(lobbyPlayers.values()));
    }
  }, 5000);

  return () => {
    clearInterval(interval);
    lobbyPlayers.clear();
    Logger.info('Monitoramento do lobby encerrado.');
  };
}

/**
 * Retorna os jogadores atualmente no lobby.
 * @returns Lista de jogadores no lobby.
 */
export function getLobbyPlayers(): GuildMember[] {
  return Array.from(lobbyPlayers.values());
}

/**
 * Monitora o lobby e inicia o monitoramento do status dos jogadores no LoL.
 */
export function enhancedMonitorLobby(
  client: Client,
  lobbyChannelId: string,
  guild: Guild
): () => void {
  const stopMonitoring = monitorLobby(client, lobbyChannelId, async (players) => {
    const lobbyChannel = client.channels.cache.get(lobbyChannelId) as VoiceChannel;
    if (!lobbyChannel) return;

    await monitorPlayerStatus(guild, lobbyChannel);
  });

  return stopMonitoring;
}
