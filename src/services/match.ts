import { db } from '../utils/db.js';
import { Logger } from '../utils/log.js';
import {Match} from '../utils/match.js';    

/**
 * Cria uma nova partida no banco de dados.
 * @param guildId - ID do servidor Discord.
 * @param channelId - ID do canal de voz principal.
 * @param players - IDs dos jogadores participantes.
 * @param startedBy - ID do usuário que iniciou a partida.
 * @returns ID da partida criada.
 */
export async function createMatch(guildId: string, channelId: string, players: string[], startedBy: string): Promise<string> {
    if (!guildId || (!channelId && channelId !== null) || !players.length || !startedBy) {
        throw new Error('Todos os parâmetros são obrigatórios.');
    }

    const matchId = generateMatchId();
    const newMatch = {
        id: matchId,
        guildId,
        channelId,
        isActive: true,
        lastActivity: Date.now(),
        players,
        startedAt: new Date().toISOString(),
        startedBy
    };

    db.data!.matches.push(newMatch);
    db.data!.stats.totalMatchesCreated += 1;
    await db.write();

    const logger = new Logger();
    logger.log(`Partida criada: ${matchId}`, 'INFO');
    return matchId;
}

/**
 * Encerra uma partida existente no banco de dados.
 * @param matchId - ID da partida.
 * @param endedBy - ID do usuário que finalizou.
 * @returns `true` se a partida foi encerrada, caso contrário `false`.
 */
export async function endMatch(matchId: string, endedBy: string): Promise<boolean> {
    const match = db.data!.matches.find((m: Match) => m.id === matchId);
    if (!match || !match.isActive) {
        throw new Error(`Partida com ID ${matchId} não encontrada ou já encerrada.`);
    }

    match.isActive = false;
    match.endedAt = new Date().toISOString();
    match.endedBy = endedBy;
    db.data!.stats.totalMatchesEndedByInactivity += 1;
    await db.write();

    const logger = new Logger();
    logger.log(`Partida encerrada: ${matchId}`, 'INFO');
    return true;
}

/**
 * Atualiza a atividade de uma partida.
 * @param matchId - ID da partida.
 */
export async function updateMatchActivity(matchId: string): Promise<void> {
    const match = db.data!.matches.find(m => m.id === matchId);
    if (!match || !match.isActive) {
        throw new Error(`Partida com ID ${matchId} não encontrada ou não está ativa.`);
    }

    match.lastActivity = Date.now();
    await db.write();
}

/**
 * Obtém uma partida pelo ID.
 * @param matchId - ID da partida.
 * @returns Objeto Match ou null se não encontrado.
 */
export function getMatchById(matchId: string) {
    return db.data!.matches.find(m => m.id === matchId) || null;
}

/**
 * Gera um ID único para a partida.
 * @returns ID único.
 */
function generateMatchId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
}