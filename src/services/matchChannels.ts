/**
 * Este arquivo gerencia os canais de voz relacionados às partidas.
 * Ele inclui funções para criar categorias e canais de voz, mover jogadores,
 * excluir canais vazios criados pelo bot e organizar jogadores em times.
 * As funções são projetadas para facilitar a automação de partidas no Discord.
 */

import { Guild, VoiceChannel, GuildMember, CategoryChannel, ChannelType } from 'discord.js';
import { Logger } from '../utils/log.js';

const logger = new Logger();

// ==========================
// Funções de Categoria e Canal
// ==========================

/**
 * Obtém ou cria uma categoria chamada "PARTIDAS".
 * @param guild - A guilda do Discord.
 * @returns A categoria existente ou recém-criada.
 */
export async function getOrCreateCategory(guild: Guild): Promise<CategoryChannel> {
  const existing = guild.channels.cache.find(
    c => c.type === ChannelType.GuildCategory && c.name === 'PARTIDAS'
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
 * Obtém ou cria um canal de voz dentro de uma categoria.
 * @param guild - A guilda do Discord.
 * @param category - A categoria onde o canal será criado.
 * @param name - O nome do canal.
 * @returns O canal existente ou recém-criado.
 */
export async function getOrCreateChannel(
  guild: Guild,
  category: CategoryChannel,
  name: string
): Promise<VoiceChannel> {
  const existing = guild.channels.cache.find(
    c => c.type === ChannelType.GuildVoice && c.name === name
  ) as VoiceChannel;

  return (
    existing ||
    (await guild.channels.create({
      name,
      type: ChannelType.GuildVoice,
      parent: category,
      reason: `Canal criado para a partida ${name}`,
    }))
  );
}

// ==========================
// Funções de Gerenciamento de Jogadores
// ==========================

/**
 * Move jogadores para um canal de voz.
 * @param players - Lista de jogadores.
 * @param channel - Canal de voz.
 */
export async function movePlayersToChannel(players: GuildMember[], channel: VoiceChannel): Promise<void> {
  await Promise.all(
    players.map(player =>
      player.voice.setChannel(channel).catch(err =>
        Logger.error(`Erro ao mover o jogador ${player.displayName} para o canal ${channel.name}:`, err)
      )
    )
  );
}

/**
 * Exclui canais de voz vazios criados pelo bot.
 * @param guild - Guilda do Discord.
 * @param channelIds - IDs dos canais a serem excluídos.
 */
export async function deleteEmptyChannels(guild: Guild, channelIds: string[]): Promise<void> {
  await Promise.all(
    channelIds.map(async (channelId) => {
      const channel = await guild.channels.fetch(channelId);
      if (
        channel?.isVoiceBased() &&
        channel.members.size === 0 &&
        channel.parent?.name === 'PARTIDAS'
      ) {
        await channel.delete().catch(e => Logger.error(`Erro ao deletar ${channel.name}`, e));
      }
    })
  );
}

/**
 * Distribui jogadores entre dois canais de voz.
 * @param players - Lista de jogadores.
 * @param team1 - Canal do time 1.
 * @param team2 - Canal do time 2.
 */
export async function distributePlayers(players: GuildMember[], team1: VoiceChannel, team2: VoiceChannel): Promise<void> {
  const half = Math.ceil(players.length / 2);
  const team1Players = players.slice(0, half);
  const team2Players = players.slice(half);

  try {
    await Promise.all([
      ...team1Players.map(p => movePlayer(p, team1)),
      ...team2Players.map(p => movePlayer(p, team2)),
    ]);
  } catch (error) {
    Logger.error('Erro ao distribuir jogadores', error as Error);
    throw new Error('Falha ao mover jogadores para os canais');
  }
}

/**
 * Move um jogador para um canal de voz.
 * @param player - O jogador a ser movido.
 * @param channel - O canal de destino.
 */
export async function movePlayer(player: GuildMember, channel: VoiceChannel): Promise<void> {
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

// ==========================
// Funções de Organização de Times
// ==========================

/**
 * Cria uma única sala para um time.
 * @param guild - A guilda do Discord.
 * @param players - Lista de jogadores.
 * @param matchId - ID da partida.
 */
export async function createSingleRoom(guild: Guild, players: GuildMember[], matchId: string): Promise<void> {
  const category = await getOrCreateCategory(guild);
  const channelName = `Time-${matchId.slice(0, 6)}`;
  const channel = await getOrCreateChannel(guild, category, channelName);

  Logger.info(`[DISCORD] Criando sala: ${channel.name}`);
  await movePlayersToChannel(players, channel);
}

/**
 * Cria duas salas para dois times.
 * @param guild - A guilda do Discord.
 * @param players - Lista de jogadores.
 * @param matchId - ID da partida.
 */
export async function createTwoRooms(guild: Guild, players: GuildMember[], matchId: string): Promise<void> {
  const category = await getOrCreateCategory(guild);
  const half = Math.ceil(players.length / 2);
  const team1 = players.slice(0, half);
  const team2 = players.slice(half);

  const team1Channel = await getOrCreateChannel(guild, category, `Time1-${matchId.slice(0, 6)}`);
  const team2Channel = await getOrCreateChannel(guild, category, `Time2-${matchId.slice(0, 6)}`);

  Logger.info(`[DISCORD] Criando duas salas: ${team1Channel.name} e ${team2Channel.name}`);
  await Promise.all([
    movePlayersToChannel(team1, team1Channel),
    movePlayersToChannel(team2, team2Channel),
  ]);
}

/**
 * Move jogadores da sala de espera para salas de times.
 * @param guild - A guilda do Discord.
 * @param waitingRoom - Sala de espera.
 * @param teamData - Dados dos times e da partida.
 */
export async function movePlayersToTeamRooms(
  guild: Guild,
  waitingRoom: VoiceChannel,
  teamData: {
    teamPlayers: { puuid: string; riotName: string; discordId: string }[];
    matchId: string;
  }
): Promise<void> {
  const waitingPlayers = Array.from(waitingRoom.members.values());

  const teamMembers = teamData.teamPlayers
    .map(player => {
      const member = waitingPlayers.find(m =>
        m.displayName.includes(player.riotName) || m.id === player.discordId
      );
      return member ? { ...player, member } : null;
    })
    .filter(Boolean);

  if (teamMembers.length === 0) {
    Logger.info('Nenhum jogador do time encontrado na sala de espera');
    return;
  }

  if (teamMembers.length <= 5) {
    await createSingleRoom(
      guild,
      teamMembers.filter(t => t !== null).map(t => t.member!),
      teamData.matchId
    );
  } else {
    await createTwoRooms(
      guild,
      teamMembers.filter(t => t !== null).map(t => t.member!),
      teamData.matchId
    );
  }
}