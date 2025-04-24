// src/utils/riotAPI.ts
import axios from 'axios';
import NodeCache from 'node-cache';
import Bottleneck from 'bottleneck';
import { config } from '../config.js';
import { movePlayersToTeamRooms } from '../utils/discordUtils.js';
// ====================
// 1. Configurações
// ====================
const RIOT_API_KEY = config.RIOT_API_KEY;
const API_TIMEOUT = parseInt(process.env.API_TIMEOUT || '5000');
const CACHE_TTL = parseInt(process.env.CACHE_TTL || '300'); // 5 minutos
const matchCache = new NodeCache({ stdTTL: CACHE_TTL, checkperiod: 60 });
const apiLimiter = new Bottleneck({
    reservoir: 20,
    reservoirRefreshInterval: 1000,
    reservoirRefreshAmount: 20
});
// ====================
// 3. Utilitários
// ====================
function getRiotRegion(endpointType) {
    switch (endpointType) {
        case 'account':
        case 'match':
            return 'americas';
        case 'summoner':
        case 'league':
        case 'spectator':
            return 'br1';
        default:
            throw new Error(`Endpoint não suportado: ${endpointType}`);
    }
}
function getErrorMessage(error) {
    // Verificação manual para erro Axios
    const isAxiosError = (err) => {
        return typeof err === 'object' && err !== null && 'isAxiosError' in err;
    };
    if (isAxiosError(error)) {
        const message = error.response?.data?.status?.message || error.message;
        return `Erro na API: ${message}`;
    }
    if (error instanceof Error) {
        return error.message;
    }
    return 'Erro desconhecido';
}
async function getCachedData(cacheKey, fetchFunction) {
    const cached = matchCache.get(cacheKey);
    if (cached) {
        return cached;
    }
    const data = await apiLimiter.schedule(fetchFunction);
    matchCache.set(cacheKey, data);
    return data;
}
// ====================
// 4. Funções da API
// ====================
export async function fetchRiotAccount(riotId) {
    const [gameName, tagLine] = riotId.split('#');
    if (!gameName || !tagLine) {
        throw new Error('Formato de Riot ID inválido. Use: Nome#TAG');
    }
    return getCachedData(`account-${riotId}`, async () => {
        const response = await axios.get(`https://${getRiotRegion('account')}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`, {
            headers: { 'X-Riot-Token': RIOT_API_KEY },
            timeout: API_TIMEOUT
        });
        return response.data;
    });
}
export async function fetchRiotPuuid(riotId) {
    const [gameName, tagLine] = riotId.split('#');
    if (!gameName || !tagLine) {
        throw new Error('Formato de Riot ID inválido. Use: Nome#TAG');
    }
    return getCachedData(`account-${riotId}`, async () => {
        const response = await axios.get(`https://${getRiotRegion('account')}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`, {
            headers: { 'X-Riot-Token': RIOT_API_KEY },
            timeout: API_TIMEOUT,
        });
        return response.data.puuid;
    });
}
export async function fetchSummonerByName(name) {
    return getCachedData(`summoner-${name}`, async () => {
        const response = await axios.get(`https://${getRiotRegion('summoner')}.api.riotgames.com/lol/summoner/v4/summoners/by-name/${encodeURIComponent(name)}`, {
            headers: { 'X-Riot-Token': RIOT_API_KEY },
            timeout: API_TIMEOUT
        });
        return response.data;
    });
}
export async function fetchRecentMatches(puuid, count = 5) {
    return getCachedData(`matches-${puuid}-${count}`, async () => {
        const response = await axios.get(`https://${getRiotRegion('match')}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids`, {
            headers: { 'X-Riot-Token': RIOT_API_KEY },
            params: { count },
            timeout: API_TIMEOUT
        });
        return response.data;
    });
}
export async function fetchMatchDetails(matchId) {
    return getCachedData(`match-${matchId}`, async () => {
        const response = await axios.get(`https://${getRiotRegion('match')}.api.riotgames.com/lol/match/v5/matches/${matchId}`, {
            headers: { 'X-Riot-Token': RIOT_API_KEY },
            timeout: API_TIMEOUT
        });
        return response.data;
    });
}
// ====================
// 5. Lógica de Equipes
// ====================
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
export async function getTeamFromRiotAPI(summonerNames) {
    if (!summonerNames?.length) {
        throw new Error('Nenhum nome de invocador fornecido');
    }
    try {
        // 1. Busca dados dos summoners
        const summoners = await Promise.all(summonerNames.map(name => fetchSummonerByName(name)));
        // 2. Busca partidas recentes
        const matchesData = await Promise.all(summoners.map(async (summoner) => ({
            puuid: summoner.puuid,
            matchIds: await fetchRecentMatches(summoner.puuid)
        })));
        // 3. Encontra partida em comum
        const commonMatchId = findCommonMatch(matchesData);
        if (!commonMatchId) {
            return {
                teamPlayers: [],
                matchId: null
            };
        }
        // 4. Busca detalhes da partida
        const matchDetails = await fetchMatchDetails(commonMatchId);
        // 5. Filtra jogadores do mesmo time (time 100 - azul)
        const teamPlayers = matchDetails.info.participants
            .filter(p => p.teamId === 100)
            .map(p => ({
            puuid: p.puuid,
            riotName: p.summonerName
        }));
        return {
            teamPlayers,
            matchId: commonMatchId
        };
    }
    catch (error) {
        console.error('Erro detalhado:', error);
        throw new Error(`Falha ao buscar dados da API: ${getErrorMessage(error)}`);
    }
}
// ====================
// 6. Monitoramento
// ====================
export async function monitorRiotMatches(guild, waitingRoomId) {
    if (!guild || !waitingRoomId) {
        throw new Error('Guild ou waitingRoomId não fornecidos');
    }
    const waitingRoom = guild.channels.cache.get(waitingRoomId);
    if (!waitingRoom?.members?.size) {
        return;
    }
    const players = Array.from(waitingRoom.members.values());
    try {
        // 1. Obter dados do time
        const { teamPlayers, matchId } = await getTeamFromRiotAPI(players.map(p => p.displayName));
        if (!matchId || !teamPlayers.length) {
            return;
        }
        // 2. Mapear Discord IDs
        const playersWithIds = teamPlayers.map(player => {
            const discordMember = players.find(p => p.displayName.includes(player.riotName));
            return {
                ...player,
                discordId: discordMember?.id
            };
        }).filter((player) => !!player.discordId); // Filtra jogadores sem Discord ID
        // 3. Mover jogadores para salas
        if (playersWithIds.length) {
            await movePlayersToTeamRooms(guild, waitingRoom, {
                teamPlayers: playersWithIds,
                matchId
            });
        }
    }
    catch (error) {
        console.error('Erro no monitoramento:', getErrorMessage(error));
    }
}
