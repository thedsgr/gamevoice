import { db } from '../utils/db.js';
/**
 * Retorna o número de usuários ativos nas últimas 24 horas.
 */
export function getActiveUsers() {
    const now = Date.now();
    const activeUsers = db.data?.users.filter(user => now - (user.lastInteraction ?? 0) < 24 * 60 * 60 * 1000);
    return activeUsers?.length || 0;
}
/**
 * Retorna o total de partidas criadas.
 */
export function getTotalMatchesCreated() {
    return db.data?.stats.totalMatchesCreated || 0;
}
/**
 * Retorna o total de partidas encerradas por inatividade.
 */
export function getTotalMatchesEndedByInactivity() {
    return db.data?.stats.totalMatchesEndedByInactivity || 0;
}
/**
 * Retorna o total de denúncias registradas.
 */
export function getTotalReports() {
    return db.data?.reports.length || 0;
}
/**
 * Retorna o número de jogadores expulsos por denúncias.
 */
export function getPlayersKickedByReports() {
    return db.data?.stats.playersKickedByReports || 0;
}
/**
 * Retorna o número de usuários com Riot ID vinculado.
 */
export function getLinkedRiotIds() {
    const linkedUsers = db.data?.users.filter(user => user.riotId);
    return linkedUsers?.length || 0;
}
/**
 * Retorna o número de jogadores atualmente em partida.
 */
export function getPlayersInCurrentMatch() {
    const activeMatch = db.data?.matches.find(match => match.isActive);
    return activeMatch?.players.length || 0;
}
/**
 * Retorna os erros registrados nas últimas 24 horas.
 */
export function getRecentErrors() {
    const now = Date.now();
    const recentErrors = db.data?.errors.filter(error => now - error.timestamp < 24 * 60 * 60 * 1000);
    return recentErrors?.map(error => `${new Date(error.timestamp).toLocaleTimeString()} - ${error.message}`) || [];
}
//# sourceMappingURL=monitor.js.map