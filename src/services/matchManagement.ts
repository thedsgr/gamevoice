import { CategoryChannel, ChannelType, Guild, VoiceChannel, GuildMember } from 'discord.js';
import { endMatch } from './match.js';
import { Logger } from '../utils/log.js';
import { getTeamFromRiotAPI } from '../utils/riotAPI.js';

interface ActiveMatch {
    team1Channel: VoiceChannel;
    team2Channel: VoiceChannel;
    players: string[];
    checkInterval: NodeJS.Timeout;
    timeout: NodeJS.Timeout;
}

export class MatchManager {
    private static activeMatches = new Map<string, ActiveMatch>();

    public static async startMatch(guild: Guild, summonerNames: string[]): Promise<string | null> {
        try {
            // Busca informações da API da Riot
            const { teamPlayers, matchId } = await getTeamFromRiotAPI(summonerNames);
            const summoners = teamPlayers.map(player => ({ id: player.discordId || player.puuid, name: player.riotName })); // Adjust based on actual structure

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
            } else {
                // Criar duas salas para os times
                return await this.createSplitTeams(guild, matchId, discordMembers);
            }
        } catch (error) {
            Logger.error('Erro ao iniciar partida:', error instanceof Error ? error : new Error(String(error)));
            throw error;
        }
    }

    private static async getDiscordMembers(
        guild: Guild,
        summoners: { id: string; name: string }[]
    ): Promise<GuildMember[]> {
        const members: GuildMember[] = [];

        for (const summoner of summoners) {
            try {
                // Busca o membro do Discord pelo ID do summoner
                const member = await guild.members.fetch(summoner.id);
                members.push(member);
            } catch (error) {
                Logger.warn(`Summoner ${summoner.name} não encontrado no servidor`);
            }
        }

        return members;
    }

    private static async createTeamRoom(
        guild: Guild,
        matchId: string,
        members: GuildMember[],
        teamName: string
    ): Promise<string> {
        const category = await this.getOrCreateCategory(guild);
        const channel = await this.getOrCreateChannel(
            guild,
            category,
            `${teamName}-${matchId.slice(0, 6)}`
        );

        // Move os jogadores para o canal criado
        await this.movePlayersToChannel(members, channel);

        Logger.info(`Sala criada: ${channel.name} para ${members.length} jogadores.`);
        return channel.id;
    }

    private static async createSplitTeams(
        guild: Guild,
        matchId: string | null,
        players: GuildMember[]
    ): Promise<string> {
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

    private static async getOrCreateCategory(guild: Guild): Promise<CategoryChannel> {
        const existing = guild.channels.cache.find(
            (c) => c.type === ChannelType.GuildCategory && c.name === 'PARTIDAS'
        ) as CategoryChannel;

        return (
            existing ||
            (await guild.channels.create({
                name: 'PARTIDAS',
                type: ChannelType.GuildCategory,
                reason: 'Categoria para partidas automáticas',
            }))
        );
    }

    private static async getOrCreateChannel(guild: Guild, category: CategoryChannel, name: string): Promise<VoiceChannel> {
        const existing = guild.channels.cache.find(
            (c) => c.type === ChannelType.GuildVoice && c.name === name
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

    private static splitPlayersIntoTeams(players: GuildMember[]): [GuildMember[], GuildMember[]] {
        const half = Math.ceil(players.length / 2);
        const team1 = players.slice(0, half);
        const team2 = players.slice(half);
        return [team1, team2];
    }

    private static async movePlayersToChannel(players: GuildMember[], channel: VoiceChannel): Promise<void> {
        await Promise.all(
            players.map((player) =>
                player.voice.setChannel(channel).catch((e) =>
                    Logger.warn(`Erro ao mover o jogador ${player.displayName} para o canal ${channel.name}: ${e}`)
                )
            )
        );
    }

    public static async endMatch(matchId: string): Promise<void> {
        await this.cleanupMatch(matchId, false);
    }

    public static async forceEndMatch(matchId: string): Promise<void> {
        await this.cleanupMatch(matchId, true);
    }

    private static async cleanupMatch(matchId: string, forced: boolean): Promise<void> {
        const match = this.activeMatches.get(matchId);
        if (!match) return;

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

export async function createMatch(
  guildId: string,
  channelId: string | null, // Permitir null
  players: string[],
  startedBy: string
): Promise<string> {
  if (!guildId || (!channelId && channelId !== null) || !players.length || !startedBy) {
    throw new Error('Todos os parâmetros são obrigatórios.');
  }

  // Lógica para criar a partida
  const matchId = `match-${Date.now()}`; // Exemplo de geração de ID único
  return Promise.resolve(matchId);
}