import { ChannelType } from 'discord.js';
import { endMatch } from './match.js';
import { Logger } from '../utils/log.js';
import { getTeamFromRiotAPI } from '../utils/riotAPI.js';
export class MatchManager {
    static async startMatch(guild, summonerNames) {
        try {
            // Busca informações da API da Riot
            const { teamPlayers, matchId, summoners } = await getTeamFromRiotAPI(summonerNames);
            if (teamPlayers.length === 0) {
                Logger.warn('Nenhum jogador válido encontrado no mesmo time');
                return null;
            }
            // Obter membros do Discord correspondentes
            const discordMembers = await this.getDiscordMembers(guild, summoners);
            if (teamPlayers.length <= 5) {
                // Criar uma única sala para o time
                if (!matchId) {
                    throw new Error('matchId não pode ser null.');
                }
                return await this.createTeamRoom(guild, matchId, discordMembers, 'Time Único');
            }
            else {
                // Criar duas salas para os times
                return await this.createSplitTeams(guild, matchId, discordMembers);
            }
        }
        catch (error) {
            Logger.error('Erro ao iniciar partida:', error instanceof Error ? error : new Error(String(error)));
            throw error;
        }
    }
    static async getDiscordMembers(guild, summoners) {
        const members = [];
        for (const summoner of summoners) {
            try {
                // Busca o membro do Discord pelo ID do summoner
                const member = await guild.members.fetch(summoner.id);
                members.push(member);
            }
            catch (error) {
                Logger.warn(`Summoner ${summoner.name} não encontrado no servidor`);
            }
        }
        return members;
    }
    static async createTeamRoom(guild, matchId, members, teamName) {
        const category = await this.getOrCreateCategory(guild);
        const channel = await this.getOrCreateChannel(guild, category, `${teamName}-${matchId.slice(0, 6)}`);
        // Move os jogadores para o canal criado
        await this.movePlayersToChannel(members, channel);
        Logger.info(`Sala criada: ${channel.name} para ${members.length} jogadores.`);
        return channel.id;
    }
    static async createSplitTeams(guild, matchId, players) {
        const category = await this.getOrCreateCategory(guild);
        // Dividir jogadores em dois times
        const [team1, team2] = this.splitPlayersIntoTeams(players);
        // Criar canais para os dois times
        const team1Channel = await this.getOrCreateChannel(guild, category, `Time-1-${matchId || 'partida'}`);
        const team2Channel = await this.getOrCreateChannel(guild, category, `Time-2-${matchId || 'partida'}`);
        // Mover jogadores para os canais correspondentes
        await Promise.all([
            this.movePlayersToChannel(team1, team1Channel),
            this.movePlayersToChannel(team2, team2Channel),
        ]);
        Logger.info(`Salas criadas: ${team1Channel.name} e ${team2Channel.name} para ${players.length} jogadores.`);
        return `${team1Channel.id},${team2Channel.id}`;
    }
    static async getOrCreateCategory(guild) {
        const existing = guild.channels.cache.find((c) => c.type === ChannelType.GuildCategory && c.name === 'PARTIDAS');
        return (existing ||
            (await guild.channels.create({
                name: 'PARTIDAS',
                type: ChannelType.GuildCategory,
                reason: 'Categoria para partidas automáticas',
            })));
    }
    static async getOrCreateChannel(guild, category, name) {
        const existing = guild.channels.cache.find((c) => c.type === ChannelType.GuildVoice && c.name === name);
        return (existing ||
            (await guild.channels.create({
                name,
                type: ChannelType.GuildVoice,
                parent: category,
                reason: `Canal criado para a partida ${name}`,
            })));
    }
    static splitPlayersIntoTeams(players) {
        const half = Math.ceil(players.length / 2);
        const team1 = players.slice(0, half);
        const team2 = players.slice(half);
        return [team1, team2];
    }
    static async movePlayersToChannel(players, channel) {
        await Promise.all(players.map((player) => player.voice.setChannel(channel).catch((e) => Logger.warn(`Erro ao mover o jogador ${player.displayName} para o canal ${channel.name}: ${e}`))));
    }
    static async endMatch(matchId) {
        await this.cleanupMatch(matchId, false);
    }
    static async forceEndMatch(matchId) {
        await this.cleanupMatch(matchId, true);
    }
    static async cleanupMatch(matchId, forced) {
        const match = this.activeMatches.get(matchId);
        if (!match)
            return;
        await endMatch(matchId, forced ? 'timeout' : 'system');
        await Promise.all([
            match.team1Channel.delete().catch((e) => Logger.error(`Erro ao deletar ${match.team1Channel.name}`, e)),
            match.team2Channel.delete().catch((e) => Logger.error(`Erro ao deletar ${match.team2Channel.name}`, e)),
        ]);
        clearInterval(match.checkInterval);
        clearTimeout(match.timeout);
        this.activeMatches.delete(matchId);
    }
}
MatchManager.activeMatches = new Map();
export async function createMatch(guildId, channelId, // Permitir null
players, startedBy) {
    if (!guildId || (!channelId && channelId !== null) || !players.length || !startedBy) {
        throw new Error('Todos os parâmetros são obrigatórios.');
    }
    // Lógica para criar a partida
    const matchId = `match-${Date.now()}`; // Exemplo de geração de ID único
    return Promise.resolve(matchId);
}
