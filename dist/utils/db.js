// src/utils/db.ts
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
// Caminho para o arquivo JSON do banco de dados
const adapter = new JSONFile('db.json');
// Dados padrão para inicialização
const defaultData = {
    users: [],
    reports: [],
    matches: [],
    errors: [],
    stats: {
        totalMatchesCreated: 0,
        totalMatchesEndedByInactivity: 0,
        playersKickedByReports: 0,
    },
};
// Instância do banco de dados
export const db = new Low(adapter, defaultData);
/** Inicializa o banco de dados */
export async function initDB() {
    console.log('[DB] Inicializando o banco de dados...');
    await db.read();
    db.data || (db.data = defaultData);
    await db.write();
    console.log('[DB] Banco de dados inicializado com sucesso.');
}
/** Função utilitária para garantir que o banco está inicializado */
function ensureDBInitialized() {
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
// OPERAÇÕES PARA PARTIDAS (MATCHES)
/** Cria uma nova partida no banco de dados */
export async function createMatch(matchData) {
    ensureDBInitialized();
    const newMatch = {
        ...matchData,
        id: Date.now().toString(), // ID baseado em timestamp
    };
    db.data.matches.push(newMatch);
    db.data.stats.totalMatchesCreated += 1;
    await db.write();
    return newMatch;
}
/** Finaliza uma partida */
export async function endMatch(matchId, endedBy) {
    ensureDBInitialized();
    const match = db.data.matches.find((m) => m.id === matchId);
    if (match) {
        match.isActive = false;
        match.endedAt = new Date().toISOString();
        match.endedBy = endedBy;
        match.lastActivity = Date.now();
        await db.write();
        return true;
    }
    return false;
}
/** Atualiza atividade da partida */
export async function updateMatchActivity(matchId) {
    ensureDBInitialized();
    const match = db.data.matches.find((m) => m.id === matchId);
    if (match) {
        match.lastActivity = Date.now();
        await db.write();
    }
}
/** Obtém partidas ativas de um servidor */
export async function getActiveMatches(guildId) {
    ensureDBInitialized();
    return db.data.matches.filter((m) => m.guildId === guildId && m.isActive);
}
// OPERAÇÕES PARA USUÁRIOS (mantidas do original)
export async function updateUser({ discordId, riotId, }) {
    ensureDBInitialized();
    const existingUser = db.data.users.find((user) => user.discordId === discordId);
    if (existingUser) {
        existingUser.riotId = riotId ?? undefined;
    }
    else {
        db.data.users.push({ discordId, riotId: riotId ?? undefined });
    }
    await db.write();
}
// OPERAÇÕES PARA DENÚNCIAS (mantidas do original)
export async function addReport({ targetId, reporterId, reason, matchId, }) {
    ensureDBInitialized();
    db.data.reports.push({
        targetId,
        reporterId,
        reason,
        timestamp: Date.now(),
        matchId,
    });
    await db.write();
}
/** Função para logar erros com contexto de partida */
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
