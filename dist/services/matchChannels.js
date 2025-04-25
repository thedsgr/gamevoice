/**
 * Este arquivo gerencia os canais de voz relacionados às partidas.
 * Ele inclui funções para criar categorias e canais de voz, mover jogadores,
 * excluir canais vazios criados pelo bot e organizar jogadores em times.
 */
import { ChannelType } from 'discord.js';
import { Logger } from '../utils/log.js';
const logger = new Logger();
/**
 * Obtém ou cria uma categoria chamada "PARTIDAS".
 */
export async function getOrCreateCategory(guild) {
    const existing = guild.channels.cache.find(c => c.type === ChannelType.GuildCategory && c.name === 'PARTIDAS');
    if (existing)
        return existing;
    try {
        return await guild.channels.create({
            name: 'PARTIDAS',
            type: ChannelType.GuildCategory,
            reason: 'Categoria para partidas automáticas',
        });
    }
    catch (error) {
        logger.error('Falha ao criar categoria', error);
        throw new Error('Não foi possível criar a categoria de partidas');
    }
}
/**
 * Cria dois canais de voz para os times.
 */
export async function createTeamChannels(guild, matchId) {
    const category = await getOrCreateCategory(guild);
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
    }
    catch (error) {
        logger.error('Falha ao criar canais de time', error);
        throw new Error('Não foi possível criar os canais da partida');
    }
}
/**
 * Move jogadores para um canal de voz.
 */
export async function movePlayersToChannel(guild, waitingRoom, teamData) {
    // Implementação da função
}
/**
 * Distribui jogadores entre dois canais de voz.
 */
export async function distributePlayers(guild, players, team1, team2, waitingRoom, matchData) {
    const half = Math.ceil(players.length / 2);
    const team1Players = players.slice(0, half);
    const team2Players = players.slice(half);
    try {
        await Promise.all([
            movePlayersToChannel(guild, waitingRoom, {
                teamPlayers: [...matchData.teamBlue, ...matchData.teamRed].map(player => ({
                    puuid: player.puuid,
                    riotName: player.summonerName,
                    discordId: players.find(p => p.user.id === player.discordId)?.id || '',
                }))
            }),
            movePlayersToChannel(guild, team2, {
                teamPlayers: team2Players.map(player => ({
                    puuid: '',
                    riotName: '',
                    discordId: player.id,
                })),
            }),
        ]);
    }
    catch (error) {
        logger.error('Erro ao distribuir jogadores', error);
        throw new Error('Falha ao mover jogadores para os canais');
    }
}
