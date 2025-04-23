// src/utils/db.ts
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { Client } from 'discord.js';

/** Estrutura completa do banco de dados */
export interface DatabaseSchema {
  users: UserData[];
  reports: Report[];
  matches: Match[];
  errors: ErrorLog[];
  stats: Stats;
  waitingRoomChannelId?: string;
  logChannelId?: string;
  activeVoiceChannel?: string;
  logs?: LogEntry[];
  systemLogs?: SystemLogEntry[];
}

export interface UserData {
  discordId: string;
  severeOffenses?: number;
  riotId?: string;
  lastInteraction?: number;
  matchesPlayed?: number;
}

export interface Report {
  targetId: string;
  reporterId: string;
  reason: string;
  timestamp: number;
  matchId?: string;
}

export interface Match {
  id: string;
  guildId: string;
  channelId: string;
  waitingChannelId?: string;
  isActive: boolean;
  lastActivity: number;
  players: string[];
  startedAt: string;
  startedBy: string;
  endedAt?: string;
  endedBy?: string;
}

export interface ErrorLog {
  timestamp: number;
  message: string;
  matchId?: string;
  stack?: string;
}

export interface Stats {
  totalMatchesCreated: number;
  totalMatchesEndedByInactivity: number;
  playersKickedByReports: number;
  averageMatchDuration?: number;
}

interface LogEntry {
  timestamp: Date;
  action: string;
  userId?: string;
  details: string | Record<string, unknown>;
}

interface SystemLogEntry {
  timestamp: Date;
  message: string;
}

// Caminho para o arquivo JSON do banco de dados
const adapter = new JSONFile<DatabaseSchema>('db.json');

// Dados padrão para inicialização
const defaultData: DatabaseSchema = {
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
  db.data ||= defaultData;
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
export async function recoverState(client: Client) {
  if (!db.data) return;

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
    } catch (error) {
      console.error(`[DB] Erro ao recuperar estado da partida ${match.id}:`, error);
      match.isActive = false;
    }
  }

  await db.write();
  console.log('[DB] Estado do bot recuperado com sucesso.');
}

// OPERAÇÕES PARA PARTIDAS (MATCHES)

/** Cria uma nova partida no banco de dados */
export async function createMatch(matchData: Omit<Match, 'id'>) {
  ensureDBInitialized();

  const newMatch: Match = {
    ...matchData,
    id: Date.now().toString(), // ID baseado em timestamp
  };

  db.data!.matches.push(newMatch);
  db.data!.stats.totalMatchesCreated += 1;

  await db.write();
  return newMatch;
}

/** Finaliza uma partida */
export async function endMatch(matchId: string, endedBy: string) {
  ensureDBInitialized();

  const match = db.data!.matches.find((m) => m.id === matchId);
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
export async function updateMatchActivity(matchId: string) {
  ensureDBInitialized();

  const match = db.data!.matches.find((m) => m.id === matchId);
  if (match) {
    match.lastActivity = Date.now();
    await db.write();
  }
}

/** Obtém partidas ativas de um servidor */
export async function getActiveMatches(guildId: string) {
  ensureDBInitialized();
  return db.data!.matches.filter((m) => m.guildId === guildId && m.isActive);
}

// OPERAÇÕES PARA USUÁRIOS (mantidas do original)
export async function updateUser({
  discordId,
  riotId,
}: {
  discordId: string;
  riotId: string | null;
}) {
  ensureDBInitialized();

  const existingUser = db.data!.users.find((user) => user.discordId === discordId);
  if (existingUser) {
    existingUser.riotId = riotId ?? undefined;
  } else {
    db.data!.users.push({ discordId, riotId: riotId ?? undefined });
  }

  await db.write();
}

// OPERAÇÕES PARA DENÚNCIAS (mantidas do original)
export async function addReport({
  targetId,
  reporterId,
  reason,
  matchId,
}: {
  targetId: string;
  reporterId: string;
  reason: string;
  matchId?: string;
}) {
  ensureDBInitialized();

  db.data!.reports.push({
    targetId,
    reporterId,
    reason,
    timestamp: Date.now(),
    matchId,
  });

  await db.write();
}

/** Função para logar erros com contexto de partida */
export async function logError(error: Error, context?: { matchId?: string }) {
  ensureDBInitialized();

  db.data!.errors.push({
    timestamp: Date.now(),
    message: error.message,
    stack: error.stack,
    matchId: context?.matchId,
  });

  await db.write();
}