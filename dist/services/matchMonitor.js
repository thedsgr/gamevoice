/**
 * Este arquivo monitora partidas e canais de voz relacionados às partidas.
 * Ele inclui funções para:
 * - Monitorar canais de voz vazios e encerrar partidas inativas.
 * - Monitorar partidas ativas na API da Riot.
 * - Gerenciar a lista de espera de jogadores.
 * - Validar jogadores em uma mesma partida.
 * - Organizar jogadores em salas de voz com base nos times.
 * As funções são projetadas para automatizar o gerenciamento de partidas no Discord.
 */
import { db } from '../utils/db.js';
import { Client, ChannelType } from 'discord.js';
import { getTeamFromRiotAPI, fetchActiveGame } from '../utils/riotAPI.js';
import { movePlayersToTeamRooms } from './matchChannels.js';
import { Logger } from '../utils/log.js';
import { MatchManager, endMatch } from './matchManager.js';
import { getLinkedRiotId } from '../services/users.js';
// Configurações
const EMPTY_CHANNEL_TIMEOUT = 60 * 1000; // 1 minuto
const MONITOR_INTERVAL = 10 * 1000; // 10 segundos
/**
 * Retorna estatísticas de uso do bot
 */
export function getBotStatistics() {
    const data = db.data;
    if (!data)
        return {};
    const now = Date.now();
    const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000;
    return {
        activeUsers: data.users.filter(user => (user.lastInteraction ?? 0) > twentyFourHoursAgo).length || 0,
        totalMatches: data.stats.totalMatchesCreated || 0,
        inactiveMatches: data.stats.totalMatchesEndedByInactivity || 0,
        reports: data.reports.length || 0,
        kicksByReports: data.stats.playersKickedByReports || 0,
        linkedAccounts: data.users.filter(user => (user.riotAccounts?.length ?? 0) > 0).length || 0,
        currentPlayers: data.matches.find(match => match.isActive)?.players.length || 0,
        recentErrors: data.errors.filter(error => error.timestamp > twentyFourHoursAgo).map(error => ({
            time: new Date(error.timestamp).toLocaleTimeString(),
            message: error.message
        })) || []
    };
}
// ==========================
// Funções de Monitoramento
// ==========================
/**
 * Monitora e limpa canais de voz vazios criados pelo bot.
 * @param client - Instância do cliente Discord.
 */
export function monitorEmptyChannels(client) {
    setInterval(() => {
        client.guilds.cache.forEach((guild) => {
            const voiceChannels = guild.channels.cache.filter((channel) => channel.type === ChannelType.GuildVoice);
            voiceChannels.forEach(async (channel) => {
                const voiceChannel = channel;
                if (voiceChannel.members.size === 0) {
                    const match = db.data?.matches.find((m) => m.channelId === voiceChannel.id && m.isActive);
                    if (match) {
                        const inactiveTime = Date.now() - (match.lastActivity || Date.now());
                        if (inactiveTime >= EMPTY_CHANNEL_TIMEOUT) {
                            await endMatch(match.id, "system");
                            await voiceChannel.delete();
                            console.log(`🗑️ Canal ${voiceChannel.name} excluído por inatividade`);
                        }
                    }
                }
            });
        });
    }, MONITOR_INTERVAL);
}
/**
 * Monitora partidas na API da Riot e organiza jogadores em salas de voz.
 * @param guild - A guilda do Discord.
 * @param waitingRoomId - ID da sala de espera.
 */
export async function monitorRiotMatches(guild, waitingRoomId) {
    try {
        const waitingRoom = guild.channels.cache.get(waitingRoomId);
        if (!waitingRoom?.members?.size) {
            console.log('Sala de espera vazia');
            return;
        }
        const players = Array.from(waitingRoom.members.values());
        // Obtém os dados dos jogadores
        const playerData = await Promise.all(players.map(async (player) => ({
            summonerId: await getLinkedRiotId(player.id),
            discordId: player.id,
        })));
        // Filtra jogadores sem um summonerId válido
        const validPlayers = playerData.filter(player => player.summonerId !== null);
        const matchData = await validatePlayersInSameMatch(validPlayers);
        if (!matchData) {
            console.log('Nenhuma partida válida encontrada.');
            return;
        }
        console.log(`Partida detectada (ID: ${matchData.matchId})`);
        console.log(`Time Azul: ${matchData.teamBlue.map(p => p.summonerName).join(', ')}`);
        console.log(`Time Vermelho: ${matchData.teamRed.map(p => p.summonerName).join(', ')}`);
        // Organiza os jogadores em salas de voz com base nos times
        await movePlayersToTeamRooms(guild, waitingRoom, {
            teamPlayers: [...matchData.teamBlue, ...matchData.teamRed].map(player => ({
                puuid: player.puuid,
                riotName: player.summonerName,
                discordId: validPlayers.find(p => p.summonerId === player.summonerId)?.discordId || '',
            })),
            matchId: matchData.matchId.toString(),
        });
    }
    catch (error) {
        console.error('Erro ao monitorar partidas:', error);
    }
}
// ==========================
// Funções Auxiliares
// ==========================
/**
 * Valida se os jogadores estão na mesma partida ativa.
 * @param players - Lista de jogadores com summonerId e discordId.
 * @returns Dados da partida ou null se os jogadores não estiverem na mesma partida.
 */
export async function validatePlayersInSameMatch(players) {
    const activeGames = await Promise.all(players.map(async (player) => {
        const playerId = player.discordId; // Certifique-se de passar uma string
        const game = await fetchActiveGame(player.summonerId, playerId);
        return game ? { ...game, discordId: player.discordId } : null;
    }));
    const validGames = activeGames.filter((game) => game !== null);
    if (validGames.length === 0) {
        console.log('Nenhum jogador está em uma partida ativa.');
        return null;
    }
    const matchId = validGames[0].gameId;
    const sameMatch = validGames.every((game) => game.gameId === matchId);
    if (!sameMatch) {
        console.log('Os jogadores não estão na mesma partida.');
        return null;
    }
    const teamBlue = validGames[0].participants.filter((p) => p.teamId === 100);
    const teamRed = validGames[0].participants.filter((p) => p.teamId === 200);
    return { matchId, teamBlue, teamRed };
}
/**
 * Adiciona um jogador à lista de espera.
 * @param discordId - ID do jogador no Discord.
 * @param riotId - ID do jogador na Riot.
 */
export async function addPlayerToWaitingList(discordId, riotId) {
    try {
        const waitingList = db.data?.waitingList || [];
        waitingList.push({ discordId, riotId, joinedAt: Date.now() });
        db.data.waitingList = waitingList;
        await db.write();
        console.log(`Jogador ${discordId} adicionado à lista de espera.`);
    }
    catch (error) {
        console.error('Erro ao adicionar jogador à lista de espera:', error);
    }
}
/**
 * Registra erros no banco de dados.
 * @param error - O erro a ser registrado.
 */
function logError(error) {
    if (!db.data)
        return;
    db.data.errors.push({
        timestamp: Date.now(),
        message: error instanceof Error ? error.message : String(error),
    });
    db.write().catch(err => console.error('Erro ao registrar erro:', err));
}
/**
 * Monitora canais de voz vazios e encerra partidas inativas.
 * @param client - Instância do cliente Discord.
 */
export function setupEmptyChannelMonitor(client) {
    async function monitorChannels() {
        try {
            const activeMatches = db.data?.matches.filter(match => match.isActive) || [];
            for (const match of activeMatches) {
                const channel = client.channels.cache.get(match.channelId);
                if (!channel?.members?.size) {
                    const inactiveTime = Date.now() - (match.lastActivity || Date.now());
                    if (inactiveTime >= EMPTY_CHANNEL_TIMEOUT) {
                        await handleEmptyChannel(channel, match);
                    }
                }
            }
        }
        catch (error) {
            console.error('Erro no monitoramento de canais:', error);
            logError(error);
        }
        finally {
            setTimeout(monitorChannels, MONITOR_INTERVAL);
        }
    }
    monitorChannels();
}
async function handleEmptyChannel(channel, match) {
    try {
        await channel.delete();
        console.log(`🗑️ Canal ${channel.name} excluído por inatividade`);
        match.isActive = false;
        db.data.stats.totalMatchesEndedByInactivity++;
        await db.write();
    }
    catch (error) {
        console.error("Erro ao excluir canal:", error);
        logError(error);
    }
}
function isValidSummonerName(name) {
    // Valida se o nome está no formato esperado (ex: Nome#TAG)
    return name.includes('#') && name.split('#').length === 2;
}
async function fetchTeamData(players) {
    const summonerNames = players.map(player => player.displayName);
    const teamDataArray = await getTeamFromRiotAPI(summonerNames); // Certifique-se de que getTeamFromRiotAPI retorna TeamData[]
    const teamData = teamDataArray[0]; // Acessa o primeiro elemento do array
    if (!teamData?.teamPlayers?.length) {
        console.log('Nenhuma partida ativa encontrada');
        return null;
    }
    // Aqui vai o código para mapear os jogadores
    const mappedPlayers = teamData.teamPlayers.map((player) => {
        const discordMember = players.find(p => p.displayName.includes(player.riotName));
        return {
            ...player,
            discordId: discordMember?.id || '',
            puuid: player.puuid || ''
        };
    });
    return {
        ...teamData,
        matchId: teamData.matchId || '',
        teamPlayers: mappedPlayers.map(player => player.riotName) // Extrai apenas o campo riotName como string
    };
}
async function processTeamData(guild, waitingRoom, teamData) {
    if (!teamData.matchId) {
        console.error('ID de partida inválido');
        return;
    }
    console.log(`Partida detectada (ID: ${teamData.matchId})`);
    await movePlayersToTeamRooms(guild, waitingRoom, {
        teamPlayers: teamData.teamPlayers.map((TeamPlayers) => ({
            puuid: TeamPlayers.puuid || '', // Ensure puuid is present
            riotName: TeamPlayers.riotName,
            discordId: TeamPlayers.discordId || ''
        })),
        matchId: teamData.matchId
    });
}
const client = new Client({ intents: [] }); // Initialize the client with appropriate intents
const players = []; // Replace with actual GuildMember array
const teamData = await fetchTeamData(players);
console.log(teamData);
const guild = await client.guilds.fetch(process.env.GUILD_ID ?? '');
const waitingRoom = guild.channels.cache.get(process.env.WAITING_ROOM_ID ?? '');
if (teamData) {
    await processTeamData(guild, waitingRoom, teamData);
}
else {
    console.error('Team data is null and cannot be processed.');
}
export async function getActiveUsers() {
    const data = db.data;
    if (!data)
        return 0;
    const now = Date.now();
    const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000;
    return data.users.filter(user => (user.lastInteraction ?? 0) > twentyFourHoursAgo).length || 0;
}
setInterval(async () => {
    const guild = await client.guilds.fetch(process.env.GUILD_ID ?? '');
    if (!guild) {
        console.error('Guild não encontrado. Verifique se GUILD_ID está definido no ambiente.');
        return;
    }
    const waitingRoomId = process.env.WAITING_ROOM_ID ?? '';
    if (!waitingRoomId) {
        console.error('WAITING_ROOM_ID não está definido no ambiente.');
        return;
    }
    await monitorRiotMatches(guild, waitingRoomId);
}, 30000); // Executa a cada 30 segundos
export function startTracking(matchData, checkMatchStatus, endMatch, forceEndMatch, intervalMs = 30000 // Intervalo padrão de 30 segundos
) {
    const checkInterval = setInterval(async () => {
        try {
            const shouldEnd = await checkMatchStatus(matchData.matchId);
            if (shouldEnd) {
                clearInterval(checkInterval);
                clearTimeout(timeout);
                await endMatch(matchData.matchId);
            }
        }
        catch (error) {
            Logger.error(`Erro ao verificar partida ${matchData.matchId}`, error);
        }
    }, intervalMs);
    const timeout = setTimeout(async () => {
        try {
            clearInterval(checkInterval);
            await forceEndMatch(matchData.matchId);
        }
        catch (error) {
            Logger.error(`Erro ao forçar encerramento da partida ${matchData.matchId}`, error);
        }
    }, 2 * 60 * 60 * 1000);
    MatchManager.addActiveMatch(matchData.matchId, {
        ...matchData,
        team1Channel: matchData.team1ChannelId,
        team2Channel: matchData.team2ChannelId,
        checkInterval,
        timeout,
        guild: guild // Pass the guild object directly if it's already available in the context
    });
}
