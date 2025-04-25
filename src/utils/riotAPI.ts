// Descrição: Este módulo fornece funções para interagir com a API da Riot Games, 
// incluindo busca de contas e partidas ativas, com tratamento de erros aprimorado e 
// cache para otimização de desempenho.

import axios from 'axios';
import { riotClient } from './httpClient.js';
import { handleApiError } from './errorHandler.js';
import NodeCache from 'node-cache';
import Bottleneck from 'bottleneck';
import { Logger } from '../utils/log.js';
import { RiotAccount, TeamData } from '../utils/shared.d.js';
import { ActiveGameResponse } from './user.d.js';

// Configurações aprimoradas
const API_CONFIG = {
    CACHE_TTL: 300,
    RATE_LIMIT: {
        reservoir: 20,
        interval: 1000,
    },
};

const cache = new NodeCache({
    stdTTL: API_CONFIG.CACHE_TTL,
    checkperiod: 60,
    useClones: false,
});

const limiter = new Bottleneck({
    reservoir: API_CONFIG.RATE_LIMIT.reservoir,
    reservoirRefreshInterval: API_CONFIG.RATE_LIMIT.interval,
    reservoirRefreshAmount: API_CONFIG.RATE_LIMIT.reservoir,
});

/**
 * Busca conta Riot com tratamento de erros robusto
 */
export async function fetchRiotAccount(riotId: string): Promise<RiotAccount> {
    const [gameName, tagLine] = riotId.split('#');
    if (!gameName || !tagLine) throw new Error('Formato de Riot ID inválido');

    const cacheKey = `account:${riotId}`;
    
    return limiter.schedule(async () => {
        try {
            const cached = cache.get<RiotAccount>(cacheKey);
            if (cached) return cached;

            const response = await riotClient.get<RiotAccount>(
                `https://americas.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${gameName}/${tagLine}`
            );

            cache.set(cacheKey, response.data);
            return response.data;
        } catch (error) {
            if (isRateLimitError(error)) {
                Logger.warn('Rate limit excedido na API da Riot');
                await new Promise(resolve => setTimeout(resolve, 1000));
                return fetchRiotAccount(riotId); // Retry
            }
            throw handleApiError(error, 'fetchRiotAccount');
        }
    });
}

/**
 * Busca PUUID com tratamento de erros robusto
 */
export async function fetchRiotPuuid(riotId: string): Promise<string> {
    const [gameName, tagLine] = riotId.split('#');
    try {
        const response = await riotClient.get<RiotAccount>(
            `/riot/account/v1/accounts/by-riot-id/${gameName}/${tagLine}`
        );
        return response.data.puuid;
    } catch (error) {
        throw handleApiError(error, 'fetchRiotPuuid');
    }
}

/**
 * Busca partida ativa com verificação de time
 */
export async function fetchActiveGame(summonerId: string, discordUserId: string): Promise<ActiveGameResponse | null> {
    try {
        const response = await riotClient.get<ActiveGameResponse>(
            `/lol/spectator/v4/active-games/by-summoner/${summonerId}`
        );
        return { ...response.data, discordUserId };
    } catch (error) {
        throw handleApiError(error, 'fetchActiveGame');
    }
}

/**
 * Verifica a saúde da API da Riot
 */
export async function checkRiotAPIHealth(): Promise<boolean> {
    try {
        const response = await riotClient.get('https://americas.api.riotgames.com/lol/status/v1/shard-data');
        return response.status === 200;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            Logger.error(
                'Erro do Axios ao verificar a saúde da API da Riot',
                new Error(String(error.response?.data || error.message))
            );
        } else if (error instanceof Error) {
            Logger.error('Erro desconhecido ao verificar a saúde da API da Riot', error);
        } else {
            Logger.error('Erro desconhecido ao verificar a saúde da API da Riot', new Error(String(error)));
        }
        return false;
    }
}

// Utilitários melhorados com tipagem correta
/**
 * Verifica se o erro é devido ao limite de taxa (Rate Limit - HTTP 429)
 */
function isRateLimitError(error: unknown): boolean {
    return axios.isAxiosError(error) && error.response?.status === 429;
}

/**
 * Monitoramento otimizado de partidas
 */
export async function monitorActiveGames(guildId: string, playerIds: string[]): Promise<{
    gameId: number;
    players: string[];
    teamId: number | null;
}[]> {
    try {
        const activeGames = new Map<number, string[]>();
        
        for (const playerId of playerIds) {
            const game = await fetchActiveGame(playerId, guildId);
            if (game) {
                const players = activeGames.get(game.gameId) || [];
                activeGames.set(game.gameId, [...players, playerId]);
            }
        }

        if (activeGames.size === 0) {
            Logger.info('Nenhuma partida ativa encontrada.');
            return [];
        }

        return Array.from(activeGames.entries()).map(([gameId, players]) => ({
            gameId,
            players,
            teamId: players.length > 1 ? 100 : null // Time azul se houver múltiplos jogadores
        }));
    } catch (error) {
        Logger.error('Falha no monitoramento de partidas', error instanceof Error ? error : new Error(String(error)));
        return [];
    }
}

/**
 * Busca informações do time na API da Riot
 */
export async function getTeamInfoFromRiotAPI(teamId: string): Promise<TeamData> {
    if (!teamId || typeof teamId !== 'string') {
        throw new Error('O teamId é obrigatório e deve ser uma string válida.');
    }
    try {
        const response = await riotClient.get<TeamData>(
            `/lol/team/v1/teams/${teamId}`
        );
        return response.data;
    } catch (error) {
        throw handleApiError(error, 'getTeamInfoFromRiotAPI');
    }
}

/**
 * Busca informações de múltiplos times na API da Riot
 */
export async function getTeamFromRiotAPI(teamIds: string[]): Promise<TeamData[]> {
    const results = await Promise.allSettled(
        teamIds.map(async (teamId) => getTeamInfoFromRiotAPI(teamId))
    );

    return results
        .filter((result): result is PromiseFulfilledResult<TeamData> => result.status === 'fulfilled')
        .map((result) => result.value);
}
