import { Match, TeamPlayers } from './match.d.js';
import { LogEntry, SystemLogEntry, ErrorLog } from './log.d.js';
import { User, RestrictedUser } from './user.d.js';

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
  reports: Report[];
  errors: ErrorLog[];
  users: User[];
  waitingList: string[];
  reports: Report[];
  matches: Match[];
  errors: ErrorLog[];
  stats: Stats;
  logChannelId?: string;
  waitingRoomChannelId?: string;
  activeVoiceChannel?: string;
  logs: LogEntry[];
  systemLogs: SystemLogEntry[];
  restrictedUsers: RestrictedUser[],
}

export interface RestrictedUser {
  userId: string;
  until: number;
  reason?: string;
}

export interface WaitingListItem {
  userId: string;
  timestamp: number;
}

/** Estrutura estendida do banco de dados */
export interface ExtendedDatabaseData extends DatabaseSchema {
  restrictedUsers: RestrictedUser[];
}

/** Objeto principal do banco de dados */
export declare const db: {
  /** Dados do banco de dados */
  data: DatabaseSchema;
  /** Lê os dados do banco de dados */
  read: () => Promise<void>;
  /** Escreve os dados no banco de dados */
  write: () => Promise<void>;
};

export function ensureDBInitialized(): void;

declare function processMatchData(data: { matchId: string; teamPlayers: TeamPlayers[] }): void;

ensureDBInitialized();
const matches = db.data.matches; // Não é necessário usar db.data?.matches

interface BotStatistics {
    activeUsers: number;
    totalMatches: number;
    inactiveMatches: number;
    reports: number;
    kicksByReports: number;
    linkedAccounts: number;
    currentPlayers: number;
    recentErrors: { time: string; message: string }[];
}