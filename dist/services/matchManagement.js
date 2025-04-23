import { ChannelType } from 'discord.js';
import { createMatch, endMatch } from './match.js';
import { Logger } from '../utils/log.js';
export class MatchManager {
    static async startMatch(guild, players) {
        // 1. Cria registro no banco
        const matchId = await createMatch(guild.id, '', // Canal será criado dinamicamente
        players.map(p => p.id), 'system');
        // 2. Cria canais dos times
        const [team1, team2] = await this.createTeamChannels(guild, matchId);
        // 3. Distribui jogadores
        await this.distributePlayers(players, team1, team2);
        // 4. Inicia monitoramento
        this.startTracking(matchId, { team1Channel: team1, team2Channel: team2, players: players.map(p => p.id) });
        return matchId;
    }
    static async createTeamChannels(guild, matchId) {
        const category = await this.getOrCreateCategory(guild);
        const baseName = 'Time';
        const [team1, team2] = await Promise.all([
            guild.channels.create({
                name: `${baseName}-1-${matchId.slice(0, 6)}`,
                type: ChannelType.GuildVoice,
                parent: category,
                reason: `Partida ${matchId}`
            }),
            guild.channels.create({
                name: `${baseName}-2-${matchId.slice(0, 6)}`,
                type: ChannelType.GuildVoice,
                parent: category,
                reason: `Partida ${matchId}`
            })
        ]);
        return [team1, team2];
    }
    static async getOrCreateCategory(guild) {
        const existing = guild.channels.cache.find(c => c.type === ChannelType.GuildCategory && c.name === 'PARTIDAS');
        return existing || await guild.channels.create({
            name: 'PARTIDAS',
            type: ChannelType.GuildCategory,
            reason: 'Categoria para partidas automáticas'
        });
    }
    static async distributePlayers(players, team1, team2) {
        const half = Math.ceil(players.length / 2);
        const team1Players = players.slice(0, half);
        const team2Players = players.slice(half);
        await Promise.all([
            ...team1Players.map(p => p.voice.setChannel(team1).catch(e => Logger.warn(`Erro ao mover ${p.displayName}: ${e}`))),
            ...team2Players.map(p => p.voice.setChannel(team2).catch(e => Logger.warn(`Erro ao mover ${p.displayName}: ${e}`)))
        ]);
    }
    static startTracking(matchId, matchData) {
        // Verificação a cada 30s
        const checkInterval = setInterval(async () => {
            try {
                // Aqui você integraria com a API da Riot
                const shouldEnd = false; // Substituir pela verificação real
                if (shouldEnd) {
                    await this.endMatch(matchId);
                }
            }
            catch (error) {
                Logger.error(`Erro ao verificar partida ${matchId}`, error);
            }
        }, 30000);
        // Timeout de segurança (2 horas)
        const timeout = setTimeout(() => {
            this.forceEndMatch(matchId);
        }, 2 * 60 * 60 * 1000);
        this.activeMatches.set(matchId, {
            ...matchData,
            checkInterval,
            timeout
        });
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
        // 1. Encerra no banco
        await endMatch(matchId, forced ? 'timeout' : 'system');
        // 2. Move jogadores de volta (opcional)
        // await this.returnToWaitingRoom(match);
        // 3. Deleta canais
        await Promise.all([
            match.team1Channel.delete().catch(e => Logger.error(`Erro ao deletar ${match.team1Channel.name}`, e)),
            match.team2Channel.delete().catch(e => Logger.error(`Erro ao deletar ${match.team2Channel.name}`, e))
        ]);
        // 4. Limpa timers
        clearInterval(match.checkInterval);
        clearTimeout(match.timeout);
        this.activeMatches.delete(matchId);
    }
}
MatchManager.activeMatches = new Map();
