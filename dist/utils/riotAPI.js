import axios from 'axios';
import NodeCache from 'node-cache';
import Bottleneck from 'bottleneck';
import { RIOT_API_KEY } from '../config.js';
// Configuração do rate limiter (20 requisições por segundo)
const limiter = new Bottleneck({
    reservoir: 20, // Allows up to 20 requests
    reservoirRefreshInterval: 1000, // Refreshes every second
    reservoirRefreshAmount: 20 // Resets to 20 requests per second
});
const matchCache = new NodeCache({ stdTTL: 300, checkperiod: 60 });
async function getCachedData(cacheKey, fetchFunction) {
    const cached = matchCache.get(cacheKey);
    if (cached) {
        console.log(`[CACHE] Hit for ${cacheKey}`);
        return cached;
    }
    console.log(`[API] Fetching ${cacheKey}`);
    const data = await limiter.schedule(fetchFunction);
    matchCache.set(cacheKey, data);
    return data;
}
export async function fetchSummoner(name, region) {
    return getCachedData(`summoner-${name}`, async () => {
        const response = await axios.get(`https://${region}.api.riotgames.com/lol/summoner/v4/summoners/by-name/${encodeURIComponent(name)}`, {
            headers: { 'X-Riot-Token': RIOT_API_KEY },
            timeout: 5000
        });
        return response.data;
    });
}
export async function fetchRecentMatches(puuid) {
    return getCachedData(`matches-${puuid}`, async () => {
        const response = await axios.get(`https://americas.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids`, {
            headers: { 'X-Riot-Token': RIOT_API_KEY },
            params: { count: 5 },
            timeout: 5000
        });
        return response.data;
    });
}
export function findCommonMatch(matchesData) {
    if (!matchesData.length)
        return null;
    let commonMatches = new Set(matchesData[0].matchIds);
    for (const { matchIds } of matchesData.slice(1)) {
        commonMatches = new Set([...commonMatches].filter(m => matchIds.includes(m)));
        if (!commonMatches.size)
            return null;
    }
    return commonMatches.size ? [...commonMatches][0] : null;
}
/**
 * Obtém os PUUIDs dos jogadores que estão no mesmo time (time 100 - azul)
 * @param summonerNames - Nomes dos invocadores
 * @returns Array de PUUIDs dos jogadores no mesmo time
 * @throws Se ocorrer erro na API ou nos dados de entrada
 */
export async function getTeamFromRiotAPI(summonerNames) {
    if (!summonerNames?.length) {
        throw new Error('Nenhum nome de invocador fornecido');
    }
    const region = 'br1';
    try {
        // 1. Busca dados dos summoners
        const summoners = await Promise.all(summonerNames.map(async (name) => {
            const summoner = await fetchSummoner(name, region);
            return {
                id: '', // Será preenchido posteriormente com o Discord ID
                name: summoner.name,
                puuid: summoner.puuid,
            };
        }));
        // 2. Busca partidas recentes
        const matchesData = await Promise.all(summoners.map(async (summoner) => ({
            puuid: summoner.puuid,
            matchIds: await fetchRecentMatches(summoner.puuid)
        })));
        // 3. Encontra partida em comum
        const commonMatchId = findCommonMatch(matchesData);
        if (!commonMatchId) {
            console.log('[RIOT API] Nenhuma partida em comum encontrada.');
            return {
                teamPlayers: [],
                matchId: null,
                summoners,
            };
        }
        // 4. Busca detalhes da partida
        const matchDetails = await getCachedData(`match-${commonMatchId}`, async () => {
            const response = await axios.get(`https://americas.api.riotgames.com/lol/match/v5/matches/${commonMatchId}`, {
                headers: { 'X-Riot-Token': RIOT_API_KEY },
                timeout: 5000
            });
            return response.data;
        });
        // 5. Filtra jogadores do mesmo time
        const teamPlayers = matchDetails.info.participants
            .filter(p => p.teamId === 100)
            .map(p => p.puuid);
        const summonerPuuids = summoners.map(s => s.puuid);
        const connectedTeamPlayers = teamPlayers.filter(puuid => summonerPuuids.includes(puuid));
        // 6. Associa jogadores ao Discord e retorna os dados
        const teamData = {
            teamPlayers: connectedTeamPlayers.map(puuid => {
                const summoner = summoners.find(s => s.puuid);
                return {
                    puuid,
                    riotName: summoner?.name || '',
                    discordId: '', // Será preenchido posteriormente
                };
            }),
            matchId: commonMatchId,
            summoners,
        };
        return teamData;
    }
    catch (error) {
        if (typeof error === 'object' && error !== null && 'response' in error) {
            const axiosError = error;
            console.error('[RIOT API] Erro:', axiosError.response.data);
            throw new Error(`Falha ao buscar dados da API: ${axiosError.response.data}`);
        }
        else if (error instanceof Error) {
            console.error('[RIOT API] Erro:', error.message);
            throw new Error(`Falha ao buscar dados da API: ${error.message}`);
        }
        else {
            console.error('[RIOT API] Erro desconhecido:', error);
            throw new Error('Falha ao buscar dados da API: Erro desconhecido');
        }
    }
}
/**
 * Cria uma única sala para o time.
 * @param players - Lista de PUUIDs dos jogadores conectados no mesmo time.
 */
async function createSingleRoom(players) {
    console.log(`[RIOT API] Criando uma sala para os jogadores: ${players.join(', ')}`);
    // Lógica para criar uma sala e mover os jogadores para ela
}
/**
 * Cria duas salas para o time.
 * @param players - Lista de PUUIDs dos jogadores conectados no mesmo time.
 */
async function createTwoRooms(players) {
    const half = Math.ceil(players.length / 2);
    const team1 = players.slice(0, half);
    const team2 = players.slice(half);
    console.log(`[RIOT API] Criando duas salas: Time 1 (${team1.join(', ')}) e Time 2 (${team2.join(', ')})`);
    // Lógica para criar duas salas e mover os jogadores para elas
}
async function monitorRiotAPI(guild, waitingRoomId) {
    const waitingRoom = guild.channels.cache.get(waitingRoomId);
    if (!waitingRoom || waitingRoom.members.size === 0) {
        console.log('Nenhum jogador na sala de espera.');
        return;
    }
    const players = Array.from(waitingRoom.members.values());
    const summonerNames = players.map(player => player.displayName);
    console.log('Monitorando a API da Riot...');
    console.log('Jogadores na sala de espera:', waitingRoom.members.map(member => member.displayName));
    try {
        const { teamPlayers, matchId } = await getTeamFromRiotAPI(summonerNames);
        console.log('Resposta da API:', { teamPlayers, matchId });
        if (teamPlayers.length > 0) {
            console.log(`Partida detectada (ID: ${matchId}). Movendo jogadores para as salas.`);
            // Lógica para criar salas e mover jogadores
        }
        else {
            console.log('Nenhuma partida em andamento para os jogadores na sala de espera.');
        }
    }
    catch (error) {
        console.error('Erro ao monitorar a API da Riot:', error);
    }
}
// Agendar a verificação a cada 30 segundos
import { Client, GatewayIntentBits } from 'discord.js';
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates] });
client.once('ready', () => {
    console.log(`Logged in as ${client.user?.tag}!`);
});
client.login(process.env.DISCORD_TOKEN);
setInterval(async () => {
    const guild = await client.guilds.fetch(process.env.GUILD_ID ?? '');
    if (!guild) {
        throw new Error('Guild não encontrado. Verifique se GUILD_ID está definido no ambiente.');
    }
    const waitingRoomId = process.env.WAITING_ROOM_ID ?? '';
    if (!waitingRoomId) {
        throw new Error('WAITING_ROOM_ID não está definido no ambiente.');
    }
    monitorRiotAPI(guild, waitingRoomId);
}, 30000);
// Declare or initialize someVariable
const someVariable = undefined; // Replace 'undefined' with an appropriate value if needed
const safeVariable = someVariable ?? 'valor-padrão';
axios.get(`https://api.example.com/${safeVariable}`);
export async function fetchRiotPuuid(riotId) {
    try {
        const [name, tag] = riotId.split('#');
        const response = await axios.get(`https://<region>.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(name)}/${encodeURIComponent(tag)}`, {
            headers: {
                'X-Riot-Token': RIOT_API_KEY,
            },
        });
        return response.data.puuid || null;
    }
    catch (error) {
        console.error('Erro ao buscar PUUID na API da Riot:', error);
        return null;
    }
}
async function fetchTeamData(players) {
    const summonerNames = players.map(player => player.displayName);
    const teamData = await getTeamFromRiotAPI(summonerNames);
    if (!teamData?.teamPlayers?.length) {
        console.log('Nenhuma partida ativa encontrada');
        return null;
    }
    // Mapeia Discord IDs e adiciona puuid
    teamData.teamPlayers.forEach(player => {
        const discordMember = players.find(p => p.displayName.includes(player.riotName));
        player.discordId = discordMember?.id ?? '';
        player.puuid = player.puuid || ''; // Certifique-se de que `puuid` está presente
    });
    return teamData;
}
