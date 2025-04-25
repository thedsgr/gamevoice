/**
 * Este arquivo gerencia o banco de dados local do projeto utilizando a biblioteca `lowdb`.
 * Ele fornece funções para inicializar, ler, escrever e manipular dados persistentes, como
 * estatísticas do bot, partidas ativas, relatórios de erros e usuários.
 *
 * Funcionalidades principais:
 * - Inicialização e recuperação do estado do banco de dados.
 * - Manipulação de dados relacionados a partidas, usuários e estatísticas.
 * - Registro de erros e recuperação de estado após reinício.
 * - Funções utilitárias para acessar estatísticas e dados específicos.
 */
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { Logger } from './log.js';
const adapter = new JSONFile('db.json');
const defaultData = {
    reports: [],
    errors: [],
    users: [],
    waitingList: [],
    matches: [],
    stats: {
        totalMatchesCreated: 0,
        totalMatchesEndedByInactivity: 0,
        playersKickedByReports: 0,
        totalMatchesEndedByPlayers: 0,
        averageMatchDuration: 0,
        totalMatchesEnded: 0,
    },
    logChannelId: undefined,
    waitingRoomChannelId: undefined,
    activeVoiceChannel: undefined,
    logs: [],
    systemLogs: [],
    restrictedUsers: [],
};
// Instância do banco de dados
export const db = new Low(adapter, defaultData);
/** Inicializa o banco de dados */
export async function initDB() {
    Logger.info('[DB] Inicializando o banco de dados...');
    try {
        await db.read();
        db.data || (db.data = defaultData); // Garante que db.data seja inicializado
        // Inicializa a lista de espera, se necessário
        if (!db.data.waitingList) {
            db.data.waitingList = [];
        }
        await db.write();
        Logger.info('[DB] Banco de dados inicializado com sucesso.');
    }
    catch (error) {
        Logger.error('Erro ao inicializar o banco de dados:', error);
    }
}
/** Garante que o banco de dados está inicializado */
export function ensureDBInitialized() {
    if (!db.data) {
        throw new Error('❌ Banco de dados não inicializado.');
    }
}
/**
 * Recupera o estado do bot após reinício.
 * @param client - O cliente do bot.
 */
export async function recoverState(client) {
    if (!db.data)
        return;
    Logger.info('[DB] Recuperando estado do bot após reinício...');
    for (const match of db.data.matches.filter((m) => m.isActive)) {
        try {
            const guild = await client.guilds.fetch(match.guildId);
            const channel = await guild.channels.fetch(match.channelId);
            if (!channel) {
                Logger.warn(`[DB] Canal não encontrado para a partida ${match.id}. Marcando como encerrada.`);
                match.isActive = false;
                match.endedAt = new Date().toISOString();
                match.endedBy = 'Sistema (recuperação)';
            }
        }
        catch (error) {
            Logger.error(`[DB] Erro ao recuperar estado da partida ${match.id}:`, error);
            match.isActive = false;
        }
    }
    await db.write();
    Logger.info('[DB] Estado do bot recuperado com sucesso.');
}
/** Registra erros no banco de dados */
export async function logError(error, context) {
    ensureDBInitialized();
    db.data.errors.push({
        timestamp: Date.now(),
        message: error.message,
        stack: error.stack,
        matchId: context?.matchId,
    });
    await db.write();
}
/** Obtém estatísticas do bot */
export function getBotStatistics() {
    ensureDBInitialized();
    const data = db.data;
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
            message: error.message,
        })),
    };
}
/** Obtém partidas ativas */
export function getActiveMatches() {
    ensureDBInitialized();
    return db.data.matches.filter(match => match.isActive);
}
/** Função utilitária para executar uma função com o banco de dados inicializado */
function withDBInitialized(fn) {
    if (!db.data) {
        throw new Error('❌ Banco de dados não inicializado.');
    }
    return fn();
}
// Inicialize a lista de espera, se necessário
if (!db.data.waitingList) {
    db.data.waitingList = [];
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
export async function getRestrictedUsers() {
    ensureDBInitialized();
    return db.data?.restrictedUsers || [];
}
export async function addOrUpdateRestrictedUser(userId, duration, reason) {
    ensureDBInitialized();
    const restrictedUsers = db.data?.restrictedUsers || [];
    const existing = restrictedUsers.find((u) => u.userId === userId);
    if (existing) {
        existing.until = Date.now() + duration;
        existing.reason = reason || existing.reason;
    }
    else {
        restrictedUsers.push({
            userId,
            until: Date.now() + duration,
            reason,
        });
    }
    db.data.restrictedUsers = restrictedUsers;
    await db.write();
}
