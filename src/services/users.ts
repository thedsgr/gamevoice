import { ensureDBInitialized } from '../utils/db.js';
import db from '../utils/db.js';
import { ExtendedClient } from '../structs/ExtendedClient.js';
import { RiotAccount, RawUser } from '../types/shared.js';
import { User } from '../types/user.d.js';

// Centralizar validações para evitar redundância
function validateUser(user: RawUser): User {
  return {
    userId: user.userId,
    lastInteraction: user.lastInteraction || Date.now(),
    riotAccounts: user.riotAccounts.map((account: any) => validateRiotAccount(account)),
    riotId: user.riotId || user.riotAccounts[0]?.riotId || '',
    riotPuuid: user.riotPuuid,
    lastMatchPlayers: user.lastMatchPlayers || []
  };
}

function validateRiotAccount(account: Partial<RiotAccount>): RiotAccount {
  return {
    riotId: account.riotId || '',
    puuid: account.puuid || '',
    gameName: account.gameName || '',
    tagLine: account.tagLine || '',
    lastVerified: account.lastVerified
  };
}

/**
 * Verifica se o usuário já existe no banco de dados. Caso contrário, cria um novo.
 * @param userId - ID do usuário no Discord.
 */
export async function ensureUserExists(userId: string): Promise<void> {
  const exists = await db('users').where({ userId }).first();
  if (!exists) {
    await db('users').insert({
      userId,
      lastInteraction: Date.now(),
      riotAccounts: JSON.stringify([]),
    });
  }
}

/** Atualiza ou cria um usuário no banco de dados */
export async function upsertUser(userId: string, update: Partial<Omit<User, 'userId'>>) {
  const user = await db('users').where({ userId }).first();
  if (user) {
    await db('users').where({ userId }).update(update);
  } else {
    await db('users').insert({ userId, ...update });
  }
}

/** Verifica se o usuário já tem um ID vinculado */
function isUserWithRiotId(user: any): user is { riotId: string } {
  return typeof user?.riotId === 'string';
}

export async function getLinkedRiotId(userId: string): Promise<string | null> {
  ensureDBInitialized();
  const user: User | undefined = await db('users').where({ userId }).first();
  
  if (isUserWithRiotId(user)) {
    return user.riotId;
  }
  
  return user && (user as User).riotAccounts && Array.isArray((user as User).riotAccounts) ? (user as User).riotAccounts[0]?.riotId ?? null : null;
}

/** Vincula uma conta Riot a um usuário Discord */
export async function linkRiotAccount(userId: string, riotId: string, puuid: string): Promise<void> {
  const user = await db('users').where({ userId }).first();

  if (!user) {
    await db('users').insert({
      userId,
      riotAccounts: JSON.stringify([{ riotId, puuid }]),
      riotId,
      riotPuuid: puuid,
      lastInteraction: Date.now(),
    });
    return;
  }

  const riotAccounts = JSON.parse(user.riotAccounts || '[]');
  const existingIndex = riotAccounts.findIndex((a: { puuid: string }) => a.puuid === puuid);

  if (existingIndex >= 0) {
    riotAccounts[existingIndex] = { riotId, puuid };
  } else {
    riotAccounts.push({ riotId, puuid });
  }

  await db('users').where({ userId }).update({
    riotAccounts: JSON.stringify(riotAccounts),
    riotId: user.riotId || riotId,
    riotPuuid: user.riotPuuid || puuid,
    lastInteraction: Date.now(),
  });
}

/** Retorna todas as contas Riot vinculadas a um usuário Discord */
export async function getRiotAccounts(userId: string): Promise<{ riotId: string; puuid: string }[]> {
  const user = await db('users').where({ userId }).first();
  if (!user) return [];

  return JSON.parse(user.riotAccounts || '[]');
}

/** Recupera um usuário pelo userId */
export async function getUser(userId: string): Promise<User | undefined> {
  ensureDBInitialized();
  const userData = await db('users').where({ userId }).first();
  return userData ? validateUser(userData) : undefined;
}

/** Busca Discord ID por Riot PUUID */
export async function getDiscordIdByPuuid(puuid: string): Promise<string | null> {
  ensureDBInitialized();
  const users = await db('users').select('*'); // Ensure this is inside an async function
  for (const user of users) {
    const validatedUser = validateUser(user); // Validação ao acessar o banco
    if (validatedUser.riotAccounts.some(acc => acc.puuid === puuid)) {
      return validatedUser.userId;
    }
  }
  return null;
}

/** Remove um usuário do banco de dados */
export async function deleteUser(userId: string): Promise<void> {
  await db('users').where({ userId }).del();
}

/** Retorna todos os usuários */
export async function getAllUsers(): Promise<any[]> {
  return await db('users').select('*');
}

/** Busca um membro do Discord em todos os servidores do cliente */
export async function findMember(client: ExtendedClient, userId: string) {
  for (const guild of client.guilds.cache.values()) {
    const member = guild.members.cache.get(userId);
    if (member) return member;
  }
  return null;
}

// Otimizar consultas ao banco de dados
export async function findUserByRiotName(riotName: string): Promise<User | undefined> {
  ensureDBInitialized();
  const users = await db('users').select('*').whereRaw("JSON_CONTAINS(riotAccounts, ?)", [
    JSON.stringify({ gameName: riotName })
  ]);

  return users.length > 0 ? validateUser(users[0]) : undefined;
}

// Melhorar tratamento de erros
export const updateUser = async ({ userId, riotId }: { userId: string; riotId: string | undefined }): Promise<void> => {
  ensureDBInitialized();

  const user = await db('users').where({ userId }).first() as User | undefined;
  if (!user) {
    throw new Error(`Usuário com ID ${userId} não encontrado.`);
  }

  await db('users').where({ userId }).update({ riotId: riotId || '' });
};

export async function getMainRiotAccount(userId: string): Promise<RiotAccount | null> {
  const user = await getUser(userId);
  if (!user || !user.riotId) return null;

  return user.riotAccounts.find(acc => acc.riotId === user.riotId) || null;
}

export async function hasRiotAccount(userId: string, puuid?: string): Promise<boolean> {
  const accounts = await getRiotAccounts(userId);
  return puuid 
    ? accounts.some(acc => acc.puuid === puuid)
    : accounts.length > 0;
}

export async function updateLastInteraction(userId: string): Promise<void> {
  await upsertUser(userId, { lastInteraction: Date.now() });
}

// Adicionar a função ensureUserShape para validar e garantir a estrutura correta de um usuário
export function ensureUserShape(user: any): User {
  return {
    userId: user.userId,
    riotAccounts: user.riotAccounts || [], // Inicializar como array vazio
    lastInteraction: user.lastInteraction || Date.now(),
    riotId: user.riotId || '',
    riotPuuid: user.riotPuuid,
    lastMatchPlayers: user.lastMatchPlayers || [],
    users: user.users || [] // Added the missing 'users' property
  };
}

/**
 * Retorna o número de Riot IDs vinculados na base de dados.
 * @returns O número de Riot IDs vinculados.
 */
export async function countLinkedRiotIds(): Promise<number> {
  const users = await db('users').select('riotAccounts');
  return users.reduce((count, user) => {
    const riotAccounts = JSON.parse(user.riotAccounts || '[]');
    return count + riotAccounts.length;
  }, 0);
}

