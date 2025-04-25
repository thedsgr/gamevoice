import { db, ensureDBInitialized } from '../utils/db.js';
import { movePlayersToChannel } from './matchChannels.js';
/**
 * Verifica se o usuário já existe no banco de dados. Caso contrário, cria um novo.
 * @param discordId - ID do usuário no Discord.
 */
export async function ensureUserExists(discordId) {
    if (!db.data) {
        throw new Error("O banco de dados não foi inicializado.");
    }
    const exists = db.data.users.some(u => u.discordId === discordId);
    if (!exists) {
        db.data.users.push({ discordId, lastInteraction: Date.now(), riotAccounts: [] });
        await db.write();
        console.log(`👤 Novo usuário salvo no banco: ${discordId}`);
    }
}
/** Atualiza ou cria um usuário no banco de dados */
export async function upsertUser(discordId, update) {
    ensureDBInitialized();
    const user = db.data.users.find((u) => u.discordId === discordId);
    if (user) {
        Object.assign(user, {
            ...update,
            lastInteraction: Date.now()
        });
    }
    else {
        db.data.users.push({
            discordId,
            riotAccounts: [],
            lastInteraction: Date.now(),
            ...update
        });
    }
    await db.write();
}
/** Verifica se o usuário já tem um ID vinculado */
export async function getLinkedRiotId(discordId) {
    const user = db.data.users.find(u => u.discordId === discordId);
    return user?.riotId || null;
}
/** Vincula uma conta Riot a um usuário Discord */
export async function linkRiotAccount(discordId, riotId, puuid) {
    const account = { riotId, puuid, gameName: '', tagLine: '' };
    const user = getUser(discordId);
    if (!user) {
        await upsertUser(discordId, {
            riotAccounts: [account]
        });
        return;
    }
    // Atualiza conta existente ou adiciona nova
    const existingIndex = user.riotAccounts.findIndex(a => a.riotId === riotId);
    if (existingIndex >= 0) {
        user.riotAccounts[existingIndex] = account;
    }
    else {
        user.riotAccounts.push(account);
    }
    await upsertUser(discordId, {
        riotAccounts: user.riotAccounts
    });
}
/** Retorna todas as contas Riot vinculadas a um usuário Discord */
export function getRiotAccounts(discordId) {
    ensureDBInitialized();
    return db.data.users.find(u => u.discordId === discordId)?.riotAccounts || [];
}
/** Recupera um usuário pelo discordId */
export function getUser(discordId) {
    ensureDBInitialized();
    const user = db.data.users.find((u) => u.discordId === discordId);
    if (user) {
        return {
            ...user,
            riotAccounts: user.riotAccounts ?? []
        };
    }
    return undefined;
}
/** Busca Discord ID por Riot PUUID */
export function getDiscordIdByPuuid(puuid) {
    ensureDBInitialized();
    for (const user of db.data.users) {
        if ((user.riotAccounts ?? []).some((acc) => acc.puuid === puuid)) {
            return user.discordId;
        }
    }
    return null;
}
/** Remove um usuário do banco de dados */
export async function deleteUser(discordId) {
    ensureDBInitialized();
    db.data.users = db.data.users.filter((u) => u.discordId !== discordId);
    await db.write();
}
/** Retorna todos os usuários */
export function getAllUsers() {
    ensureDBInitialized();
    return db.data.users;
}
/** Busca um membro do Discord em todos os servidores do cliente */
export async function findMember(client, playerId) {
    for (const guild of client.guilds.cache.values()) {
        const member = guild.members.cache.get(playerId);
        if (member)
            return member;
    }
    return null;
}
/** Busca um usuário pelo nome do invocador (Riot Name) */
export async function findUserByRiotName(riotName) {
    ensureDBInitialized();
    return db.data?.users.find(u => (u.riotAccounts ?? []).some((account) => account.riotId.includes(riotName)));
}
/** Verifica partidas ativas */
export async function checkActiveMatches(players) {
    const puuids = players.flatMap(player => getRiotAccounts(player.discordId).map(account => account.puuid));
    // Consulte a API da Riot para verificar partidas ativas
    const activeMatches = await fetchActiveMatches(puuids);
    return activeMatches;
}
/** Lida com uma partida ativa */
export async function handleActiveMatch(guild, waitingRoom, activeMatch) {
    const teamPlayers = activeMatch.players.map(player => ({
        puuid: player.puuid || 'default-puuid', // Adicione um valor padrão ou obtenha o valor correto
        riotName: player.riotName,
        discordId: player.discordId || '',
    }));
    const players = teamPlayers.map(player => guild.members.cache.get(player.discordId)).filter(Boolean);
    await movePlayersToChannel(guild, waitingRoom, {
        teamPlayers: teamPlayers.map(player => ({
            puuid: player.puuid,
            riotName: player.riotName,
            discordId: player.discordId
        }))
    });
}
async function fetchActiveMatches(puuids) {
    // Implemente a lógica para consultar a API da Riot aqui
    // Retorne uma lista de partidas ativas
    return []; // Exemplo: Retorna uma lista vazia
}
export const updateUser = async ({ discordId, riotId }) => {
    // Implementação para atualizar o usuário no banco de dados
};
