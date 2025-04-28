/**
 * Este arquivo define a estrutura do banco de dados e os tipos relacionados usados no sistema.
 * Objetivos principais:
 * 1. Garantir que todas as interações com o banco de dados sejam fortemente tipadas.
 * 2. Fornecer interfaces para as entidades armazenadas no banco de dados, como usuários, partidas e relatórios.
 * 3. Facilitar a manutenção e a escalabilidade do sistema, centralizando as definições de tipos do banco de dados.
 */

import { Match, TeamPlayers } from './match';
import { LogEntry, SystemLogEntry, ErrorLog } from '../utils/log.js';
import { User, RestrictedUser } from './user';
import { Low } from 'lowdb';

/** Representa um relatório de denúncia */
export interface Report {
  targetId: string;
  reporterId: string;
  reason: string;
  timestamp: number;
  matchId?: string;
}

/** Estatísticas gerais do sistema */
export interface Stats {
  totalMatchesCreated: number;
  totalMatchesEndedByInactivity: number;
  playersKickedByReports: number;
  totalMatchesEndedByPlayers: number;
  averageMatchDuration?: number;
  totalMatchesEnded: number;
}

/** Estrutura padrão do banco de dados */
export interface DefaultData {
  users: User[];
  restrictedUsers: RestrictedUser[];
  reports: Report[];
  matches: Match[];
  errors: ErrorLog[];
  settings: Record<string, any>;
  waitingList: string[];
  stats: Stats;
  logs: LogEntry[];
  systemLogs: SystemLogEntry[];
  guilds: string[];
  links: { userId: string; riotId: string }[];
  logChannelId?: string;
}

export type DatabaseSchema = DefaultData;

export interface RestrictedUser {
  userId: string;
  until: number;
  reason?: string;
}

export interface WaitingListItem {
  userId: string;
  timestamp: number;
}

export interface BotStatistics {
  activeUsers: number;
  totalMatches: number;
  inactiveMatches: number;
  reports: number;
  kicksByReports: number;
  linkedAccounts: number;
  currentPlayers: number;
  recentErrors: { time: string; message: string }[];
}

export interface CustomDatabase extends Low<DatabaseSchema> {
  getRiotLink: (riotId: string) => Promise<string | null>;
  saveLink: (userId: string, riotId: string) => Promise<void>;
}

const db: CustomDatabase = {
  data: { links: [] },
  read: async () => { /* implementação */ },
  write: async () => { /* implementação */ },
  getRiotLink: async (riotId: string) => {
    return db.data?.links.find(link => link.riotId === riotId)?.userId || null;
  },
  saveLink: async (userId: string, riotId: string) => {
    db.data?.links.push({ userId, riotId });
    await db.write();
  },
};

export function ensureDBInitialized(): void;
export function getBotStatistics(): BotStatistics;
export function getActiveMatches(): Match[];
export function logError(error: Error, context?: { matchId?: string }): Promise<void>;
export function recoverState(client: Client): Promise<void>;
declare const db: Low<DatabaseSchema>;
export { db };
export function ensureDBInitialized(): Promise<void>;
