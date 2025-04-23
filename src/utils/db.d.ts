import { Match, TeamPlayers } from './match.d.js';
import { LogEntry, SystemLogEntry, ErrorLog } from './log.d.js';
import { User, RestrictedUser } from './user.d.js';

/** Estrutura completa do banco de dados */
export interface DatabaseSchema {
  users: User[]; // Lista de usuários registrados
  /** Relatórios de denúncias */
  reports: Report[];
  /** Partidas criadas no sistema */
  matches: Match[]; // Lista de partidas criadas (defina ou importe o tipo Match)
  /** Logs de erros */
  errors: ErrorLog[];
  /** Estatísticas gerais do sistema */
  stats: Stats;
  /** ID do canal de espera */
  waitingRoomChannelId?: string;
  /** ID do canal de logs */
  logChannelId?: string;
  /** ID do canal de voz ativo */
  activeVoiceChannel?: string;
  /** Logs de ações realizadas */
  logs?: LogEntry[];
  /** Logs do sistema */
  systemLogs?: SystemLogEntry[];

  restrictedUsers?: RestrictedUser[];
}

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
}

/** Estrutura padrão do banco de dados */
export interface DefaultData extends DatabaseSchema {
  restrictedUsers: RestrictedUser[];
  matches: Match[];
  stats: Stats;
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