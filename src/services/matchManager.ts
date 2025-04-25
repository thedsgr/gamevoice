/**
 * Este arquivo gerencia o ciclo de vida das partidas no servidor.
 * Ele inclui funções para criar, encerrar e monitorar partidas, além de gerenciar
 * canais de voz e distribuir jogadores entre os times. Também implementa lógica
 * para limpar partidas inativas e monitorar o status das partidas em tempo real.
 */

import { CategoryChannel, ChannelType, Guild, VoiceChannel, GuildMember } from 'discord.js';
import { db } from '../utils/db.js';
import { Logger } from '../utils/log.js';
import { Match } from '../utils/match.js';

const logger = new Logger();

/**
 * Cria uma nova partida no banco de dados.
 * @param guildId - ID do servidor Discord.
 * @param players - IDs dos jogadores participantes.
 * @returns ID da partida criada.
 */
export async function createMatch(guildId: string, players: string[]): Promise<string> {
  if (!db.data) throw new Error("Banco de dados não inicializado.");

  const matchId = Date.now().toString(36) + Math.random().toString(36).substring(2);
  const newMatch: Match = {
    id: matchId, // Adiciona a propriedade 'id'
    matchId: matchId,
    guildId,
    teamPlayers: players.map((playerId) => ({
      id: playerId,
      puuid: '', // Preencha com o valor adequado
      riotName: '', // Preencha com o valor adequado
      discordId: playerId, // Supondo que o ID do Discord seja o mesmo
    })),
    players, // Adiciona a propriedade 'players'
    isActive: true,
    lastActivity: Date.now(),
    channelId: "", // Pode ser atualizado posteriormente
    startedAt: new Date().toISOString(),
    startedBy: 'system', // Pode ser substituído pelo ID do usuário que iniciou
  };

  db.data.matches.push(newMatch);
  await db.write();

  Logger.info(`Partida criada: ${matchId}`);
  return matchId;
}

/**
 * Encerra uma partida existente no banco de dados.
 * @param matchId - ID da partida.
 * @param endedBy - ID do usuário que finalizou a partida.
 */
export async function endMatch(matchId: string, endedBy: string): Promise<void> {
  if (!db.data) throw new Error("Banco de dados não inicializado.");

  const match = db.data.matches.find((m) => m.id === matchId);
  if (!match) throw new Error(`Partida ${matchId} não encontrada.`);

  match.isActive = false;
  match.endedAt = new Date().toISOString();
  match.endedBy = endedBy;

  await db.write();
  Logger.info(`Partida encerrada: ${matchId}`);
}

/**
 * Limpa partidas inativas com base no tempo de inatividade.
 * @param maxInactiveMinutes - Tempo máximo de inatividade em minutos.
 * @returns IDs das partidas encerradas.
 */
export async function cleanupInactiveMatches(maxInactiveMinutes = 30): Promise<string[]> {
  if (!db.data) throw new Error("Banco de dados não inicializado.");

  const now = Date.now();
  const inactiveMatches = db.data.matches.filter(
    (m) => m.isActive && now - m.lastActivity > maxInactiveMinutes * 60 * 1000
  );

  await Promise.all(inactiveMatches.map((m) => endMatch(m.id, 'system')));
  return inactiveMatches.map((m) => m.id);
}

export class MatchManager {
  static activeMatches: Map<string, any> = new Map();

  /**
   * Adiciona uma partida ativa ao mapa de partidas.
   * @param matchId - ID da partida.
   * @param matchData - Dados da partida.
   */
  static addActiveMatch(matchId: string, matchData: any): void {
    this.activeMatches.set(matchId, matchData);
  }

  /**
   * Inicia uma nova partida e configura todos os recursos necessários.
   * @param guild - A guilda do Discord.
   * @param players - Lista de jogadores.
   * @returns ID da partida criada.
   */
  public static async startMatch(guild: Guild, players: GuildMember[]): Promise<string> {
    try {
      if (!guild || !players?.length) {
        throw new Error('Parâmetros inválidos para startMatch');
      }

      // Cria registro no banco de dados
      const matchId = await createMatch(
        guild.id,
        players.map((p) => p.id)
      );

      // Cria canais de voz para os times
      const [team1Channel, team2Channel] = await this.createTeamChannels(guild, matchId);

      // Distribui os jogadores nos canais
      await this.distributePlayers(players, team1Channel, team2Channel);

      // Inicia o monitoramento da partida
      this.startTracking({
        matchId,
        team1Channel: team1Channel.id,
        team2Channel: team2Channel.id,
        players: players.map((p) => p.id),
        guild,
      });

      Logger.info(`Partida ${matchId} iniciada com sucesso`);
      return matchId;
    } catch (error) {
      Logger.error('Falha ao iniciar partida', error as Error);
      throw error;
    }
  }

  /**
   * Cria canais de voz para os times.
   */
  private static async createTeamChannels(guild: Guild, matchId: string): Promise<[VoiceChannel, VoiceChannel]> {
    const category = await this.getOrCreateCategory(guild);
    const baseName = 'Time';

    try {
      const [team1, team2] = await Promise.all([
        guild.channels.create({
          name: `${baseName}-1-${matchId.slice(0, 6)}`,
          type: ChannelType.GuildVoice,
          parent: category,
          reason: `Partida ${matchId}`,
          userLimit: 5,
        }),
        guild.channels.create({
          name: `${baseName}-2-${matchId.slice(0, 6)}`,
          type: ChannelType.GuildVoice,
          parent: category,
          reason: `Partida ${matchId}`,
          userLimit: 5,
        }),
      ]);

      return [team1, team2];
    } catch (error) {
      Logger.error('Falha ao criar canais de time', error as Error);
      throw new Error('Não foi possível criar os canais da partida');
    }
  }

  /**
   * Obtém ou cria a categoria para partidas.
   */
  private static async getOrCreateCategory(guild: Guild): Promise<CategoryChannel> {
    const existing = guild.channels.cache.find(
      (c) => c.type === ChannelType.GuildCategory && c.name === 'PARTIDAS'
    ) as CategoryChannel;

    if (existing) return existing;

    try {
      return await guild.channels.create({
        name: 'PARTIDAS',
        type: ChannelType.GuildCategory,
        reason: 'Categoria para partidas automáticas',
        position: 0,
      });
    } catch (error) {
      Logger.error('Falha ao criar categoria', error as Error);
      throw new Error('Não foi possível criar a categoria de partidas');
    }
  }

  /**
   * Distribui jogadores entre os canais dos times.
   */
  private static async distributePlayers(players: GuildMember[], team1: VoiceChannel, team2: VoiceChannel): Promise<void> {
    const half = Math.ceil(players.length / 2);
    const team1Players = players.slice(0, half);
    const team2Players = players.slice(half);

    try {
      await Promise.all([
        ...team1Players.map((p) => this.movePlayer(p, team1)),
        ...team2Players.map((p) => this.movePlayer(p, team2)),
      ]);
    } catch (error) {
      Logger.error('Erro ao distribuir jogadores', error as Error);
      throw new Error('Falha ao mover jogadores para os canais');
    }
  }

  /**
   * Move um jogador para um canal com tratamento de erro.
   */
  private static async movePlayer(player: GuildMember, channel: VoiceChannel): Promise<void> {
    try {
      if (!player.voice.channelId) {
        Logger.warn(`Jogador ${player.displayName} não está em um canal de voz`);
        return;
      }
      await player.voice.setChannel(channel);
      Logger.info(`Jogador ${player.displayName} movido para ${channel.name}`);
    } catch (error) {
      Logger.warn(`Falha ao mover ${player.displayName}: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Inicia o monitoramento da partida.
   */
  private static startTracking(matchData: Omit<{ matchId: string; team1Channel: string; team2Channel: string; players: string[]; guild: Guild; }, 'checkInterval' | 'timeout'>): void {
    // Verificação periódica do status da partida
    const checkInterval = setInterval(async () => {
      try {
        const shouldEnd = await this.checkMatchStatus(matchData.matchId);
        if (shouldEnd) {
          await this.endMatch(matchData.matchId);
        }
      } catch (error) {
        Logger.error(`Erro ao verificar partida ${matchData.matchId}`, error as Error);
      }
    }, 30000); // A cada 30 segundos

    // Timeout de segurança
    const timeout = setTimeout(() => {
      this.forceEndMatch(matchData.matchId);
    }, 2 * 60 * 60 * 1000); // 2 horas

    this.activeMatches.set(matchData.matchId, { 
      ...matchData, 
      checkInterval,
      timeout
    });
  }

  /**
   * Verifica o status da partida na API da Riot.
   */
  private static async checkMatchStatus(matchId: string): Promise<boolean> {
    // Implemente a lógica real de verificação aqui
    // Retorna true se a partida deve ser encerrada
    return false;
  }

  /**
   * Encerra uma partida normalmente.
   */
  public static async endMatch(matchId: string): Promise<void> {
    await this.cleanupMatch(matchId, false);
  }

  /**
   * Força o encerramento de uma partida.
   */
  public static async forceEndMatch(matchId: string): Promise<void> {
    await this.cleanupMatch(matchId, true);
  }

  /**
   * Limpa todos os recursos de uma partida.
   */
  private static async cleanupMatch(matchId: string, forced: boolean): Promise<void> {
    const match = this.activeMatches.get(matchId);
    if (!match) return;

    try {
      // Encerra no banco de dados
      await endMatch(matchId, 'system');

      // Remove canais de voz
      const team1Channel = await match.guild.channels.fetch(match.team1Channel) as VoiceChannel;
      const team2Channel = await match.guild.channels.fetch(match.team2Channel) as VoiceChannel;
      await this.deleteChannels([team1Channel, team2Channel]);

      // Limpa timers
      clearInterval(match.checkInterval);
      clearTimeout(match.timeout);
      
      // Remove do mapa de partidas ativas
      this.activeMatches.delete(matchId);

      Logger.info(`Partida ${matchId} encerrada ${forced ? 'forçadamente' : 'normalmente'}`);

    } catch (error) {
      Logger.error(`Erro ao encerrar partida ${matchId}`, error as Error);
      throw error;
    }
  }

  /**
   * Deleta canais com tratamento de erro.
   */
  private static async deleteChannels(channels: VoiceChannel[]): Promise<void> {
    await Promise.all(
      channels.map(channel => 
        channel.delete()
          .catch(e => Logger.error(`Erro ao deletar ${channel.name}`, e))
    ));
  }

  /**
   * Obtém informações de uma partida ativa.
   */
  public static getMatch(matchId: string): { matchId: string; team1Channel: string; team2Channel: string; players: string[]; guild: Guild; checkInterval: NodeJS.Timeout; timeout: NodeJS.Timeout } | undefined {
    return this.activeMatches.get(matchId);
  }

  /**
   * Remove uma partida ativa do mapa de partidas.
   */
  public static removeActiveMatch(matchId: string): void {
    this.activeMatches.delete(matchId);
  }

  /**
   * Obtém uma partida ativa pelo ID.
   */
  public static getActiveMatch(matchId: string): { matchId: string; team1Channel: string; team2Channel: string; players: string[]; guild: Guild; checkInterval: NodeJS.Timeout; timeout: NodeJS.Timeout } | undefined {
    return this.activeMatches.get(matchId);
  }
}