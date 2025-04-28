// Descrição: Este módulo fornece funções para interagir com a API da Riot Games, 
// incluindo busca de contas e partidas ativas, com tratamento de erros aprimorado e 
// cache para otimização de desempenho.

import axios, { AxiosError } from 'axios';
import { riotClient } from './httpClient.js';
import { handleApiError } from './errorHandler.js';
import NodeCache from 'node-cache';
import Bottleneck from 'bottleneck';
import { Logger } from '../utils/log.js';
import { RiotAccount, TeamData } from '../types/shared.js';
import { ActiveGameResponse } from '../types/user.js';

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

// Adicionando monitoramento do cache
setInterval(() => {
    const keys = cache.keys();
    const size = keys.length;
    if (size > 100) {
        Logger.warn(`O cache contém ${size} itens, considere revisar a política de limpeza.`, { cacheSize: size });
    }
}, 60000); // Verifica a cada 60 segundos

// Adicionando limpeza automática ao monitoramento do cache
setInterval(() => {
    const keys = cache.keys();
    const size = keys.length;
    if (size > 100) {
        Logger.warn(`O cache contém ${size} itens, iniciando limpeza automática.`);
        keys.slice(0, size - 100).forEach(key => cache.del(key));
    }
}, 60000); // Verifica a cada 60 segundos

// Adicionando logs para monitorar o uso do rate limiter
limiter.on('depleted', () => {
    Logger.warn('O limite de taxa foi atingido. Aguardando recarga do reservatório.', {
        reservoir: API_CONFIG.RATE_LIMIT.reservoir,
        interval: API_CONFIG.RATE_LIMIT.interval
    });
});

/**
 * Busca conta Riot com tratamento de erros robusto
 */
async function fetchRiotAccountWithRetry(riotId: string, attempts = 0): Promise<RiotAccount> {
    const MAX_ATTEMPTS = 3;
    try {
        return await fetchRiotAccount(riotId);
    } catch (error) {
        if (isRateLimitError(error) && attempts < MAX_ATTEMPTS) {
            Logger.warn(`Rate limit excedido. Tentativa ${attempts + 1} de ${MAX_ATTEMPTS}.`, {
                riotId,
                attempt: attempts + 1,
                maxAttempts: MAX_ATTEMPTS
            });
            await new Promise(resolve => setTimeout(resolve, 1000));
            return fetchRiotAccountWithRetry(riotId, attempts + 1);
        }
        Logger.error('Erro ao buscar conta Riot após múltiplas tentativas.', error instanceof Error ? error : new Error(String(error)), { riotId, attempts });
        throw error;
    }
}

export async function fetchRiotAccount(riotId: string): Promise<RiotAccount> {
    const [gameName, tagLine] = riotId.split('#');
    if (!gameName || !tagLine) throw new Error('Formato de Riot ID inválido');

    const cacheKey = `account:${riotId}`;

    return limiter.schedule(async () => {
        const cached = cache.get<RiotAccount>(cacheKey);
        if (cached) return cached;

        try {
            const response = await riotClient.get<RiotAccount>(
                `https://americas.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${gameName}/${tagLine}`
            );

            cache.set(cacheKey, response.data);
            return response.data;
        } catch (error) {
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
export async function fetchActiveGame(summonerId: string, guildId?: string): Promise<any> {
    const apiKey = process.env.RIOT_API_KEY;

    if (!apiKey) {
        throw new Error('❌ [ERROR] A chave da API da Riot (RIOT_API_KEY) não está configurada.');
    }

    console.info(`ℹ️ [INFO] Usando a chave de API: ${apiKey}`);
    console.info(`ℹ️ [INFO] Endpoint acessado: https://br1.api.riotgames.com/lol/spectator/v5/active-games/by-summoner/${summonerId}`);

    try {
        console.info(`ℹ️ [INFO] Buscando partida ativa para o Summoner ID: ${summonerId}`);
        const response = await axios.get(
            `https://br1.api.riotgames.com/lol/spectator/v5/active-games/by-summoner/${summonerId}`,
            {
                headers: {
                    'X-Riot-Token': apiKey,
                },
            }
        );
        return response.data;
    } catch (error: any) {
        if (error.response?.status === 403) {
            console.error('❌ [ERROR] Acesso negado. Verifique se a chave da API é válida e tem as permissões corretas.');
        } else if (error.response?.status === 404) {
            console.warn('⚠️ [WARN] Nenhuma partida ativa encontrada para o Summoner ID fornecido.');
        } else {
            console.error('❌ [ERROR] Erro inesperado ao buscar partida ativa:', error.message);
        }
        throw error;
    }
}

/**
 * Busca o Summoner ID usando o nome do invocador
 */
export async function fetchSummonerId(summonerName: string): Promise<string> {
    const apiKey = process.env.RIOT_API_KEY;

    if (!apiKey) {
        throw new Error('❌ [ERROR] A chave da API da Riot (RIOT_API_KEY) não está configurada.');
    }

    try {
        console.info(`ℹ️ [INFO] Buscando Summoner ID para o nome do invocador: ${summonerName}`);
        const response = await axios.get(
            `https://br1.api.riotgames.com/lol/summoner/v4/summoners/by-name/${encodeURIComponent(summonerName)}`,
            {
                headers: {
                    'X-Riot-Token': apiKey,
                },
            }
        );
        return response.data.id; // O campo "id" é o Summoner ID
    } catch (error: any) {
        if (error.response?.status === 403) {
            console.error('❌ [ERROR] Acesso negado. Verifique se a chave da API é válida e tem as permissões corretas.');
        } else if (error.response?.status === 404) {
            console.warn('⚠️ [WARN] Nome do invocador não encontrado.');
        } else {
            console.error('❌ [ERROR] Erro inesperado ao buscar Summoner ID:', error.message);
        }
        throw error;
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
            const axiosError = error as AxiosError;
            Logger.error(
                'Erro do Axios ao verificar a saúde da API da Riot',
                new Error(String(axiosError.response?.data || axiosError.message))
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
    return axios.isAxiosError(error) && (error as AxiosError).response?.status === 429;
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

/**
 * Registra um Webhook na API da Riot para notificações em tempo real.
 */
export async function registerRiotWebhook() {
  const webhookUrl = 'https://seu-servidor.com/webhook/riot'; // Substitua pela URL real do seu servidor

  try {
    await axios.post('https://api.riotgames.com/webhooks', {
      url: webhookUrl,
      eventType: 'playerJoinedGame', // Exemplo de evento
    }, {
      headers: { 'Authorization': `Bearer ${process.env.RIOT_API_KEY}` }
    });

    console.log('Webhook registrado com sucesso');
  } catch (error) {
    console.error('Erro ao registrar webhook:', error);
  }
}
