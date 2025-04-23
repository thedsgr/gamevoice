import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
/** Estrutura completa do banco de dados */
const adapter = new JSONFile('db.json');
const defaultData = {
    restrictedUsers: [],
    users: [],
    reports: [],
    matches: [],
    errors: [],
    stats: {
        totalMatchesCreated: 0,
        totalMatchesEndedByInactivity: 0,
        playersKickedByReports: 0,
        totalMatchesEndedByPlayers: 0,
    },
    logChannelId: undefined,
    waitingRoomChannelId: undefined,
    activeVoiceChannel: undefined,
    logs: [],
    systemLogs: [],
};
// Instância do banco de dados
export const db = new Low(adapter, defaultData);
/** Inicializa o banco de dados */
export async function initDB() {
    console.log('[DB] Inicializando o banco de dados...');
    try {
        await db.read();
        db.data || (db.data = defaultData);
        await db.write();
        console.log('[DB] Banco de dados inicializado com sucesso.');
    }
    catch (error) {
        console.error('Erro ao inicializar o banco de dados:', error);
    }
}
/** Função utilitária para garantir que o banco está inicializado */
export function ensureDBInitialized() {
    if (!db.data) {
        throw new Error('❌ Banco de dados não inicializado.');
    }
}
/** Função utilitária para executar uma função com o banco de dados inicializado */
function withDBInitialized(fn) {
    if (!db.data) {
        throw new Error('❌ Banco de dados não inicializado.');
    }
    return fn();
}
/**
 * Recupera o estado do bot após reinício.
 * @param client - O cliente do bot.
 */
export async function recoverState(client) {
    if (!db.data)
        return;
    console.log('[DB] Recuperando estado do bot após reinício...');
    for (const match of db.data.matches.filter((m) => m.isActive)) {
        try {
            const guild = await client.guilds.fetch(match.guildId);
            const channel = await guild.channels.fetch(match.channelId);
            if (!channel) {
                console.warn(`[DB] Canal não encontrado para a partida ${match.id}. Marcando como encerrada.`);
                match.isActive = false;
                match.endedAt = new Date().toISOString();
                match.endedBy = 'Sistema (recuperação)';
            }
        }
        catch (error) {
            console.error(`[DB] Erro ao recuperar estado da partida ${match.id}:`, error);
            match.isActive = false;
        }
    }
    await db.write();
    console.log('[DB] Estado do bot recuperado com sucesso.');
}
/** Função para logar erros com contexto de partida */
export async function logError(error, context) {
    ensureDBInitialized();
    const match = db.data.matches.find((m) => m.id === context?.matchId);
    db.data.errors.push({
        timestamp: Date.now(),
        message: error.message,
        stack: error.stack,
        matchId: context?.matchId,
    });
    await db.write();
}
/** Função para obter estatísticas do bot */
export function getBotStatistics() {
    const data = db.data;
    if (!data)
        return {
            activeUsers: 0,
            totalMatches: 0,
            inactiveMatches: 0,
            reports: 0,
            kicksByReports: 0,
            linkedAccounts: 0,
            currentPlayers: 0,
            recentErrors: []
        };
    const now = Date.now();
    const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000;
    return {
        activeUsers: data.users.filter(user => (user.lastInteraction ?? 0) > twentyFourHoursAgo).length,
        totalMatches: data.stats.totalMatchesCreated || 0,
        inactiveMatches: data.stats.totalMatchesEndedByInactivity || 0,
        reports: data.reports.length || 0,
        kicksByReports: data.stats.playersKickedByReports || 0,
        linkedAccounts: data.users.filter(user => (user.riotAccounts?.length ?? 0) > 0).length,
        currentPlayers: data.matches.find(match => match.isActive)?.players.length || 0,
        recentErrors: data.errors.filter(error => error.timestamp > twentyFourHoursAgo).map(error => ({
            time: new Date(error.timestamp).toLocaleTimeString(),
            message: error.message
        }))
    };
}
export const getTotalMatchesCreated = () => {
    return db.data?.stats.totalMatchesCreated || 0;
};
export const getPlayersKickedByReports = () => {
    return db.data?.stats.playersKickedByReports || 0;
};
export const getTotalMatchesEndedByInactivity = () => {
    return db.data?.stats.totalMatchesEndedByInactivity || 0;
};
export const getLinkedRiotIds = () => {
    return db.data?.users.filter(user => (user.riotAccounts?.length ?? 0) > 0).length || 0;
};
export const getPlayersInCurrentMatch = () => {
    return db.data?.matches.find(match => match.isActive)?.players.length || 0;
};
export const getRecentErrors = () => {
    const now = Date.now();
    const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000;
    return db.data?.errors
        .filter(error => error.timestamp > twentyFourHoursAgo)
        .map(error => `${new Date(error.timestamp).toLocaleTimeString()} - ${error.message}`) || [];
};
export const getTotalMatchesEndedByPlayers = () => {
    return db.data?.stats.totalMatchesEndedByPlayers || 0;
};
export const getActiveUsers = () => {
    const now = Date.now();
    const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000;
    return db.data?.users.filter(user => (user.lastInteraction ?? 0) > twentyFourHoursAgo).length || 0;
};
