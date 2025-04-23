/** Representa um log de ação */
export interface LogEntry {
  timestamp: number;
  message: string;
  action?: string;
  userId?: string;
  details?: string | Record<string, unknown>;
}

/** Representa um log do sistema */
export interface SystemLogEntry {
  timestamp: number;
  message: string;
  context?: string;
  level: 'info' | 'warn' | 'error';
}

export class Logger {
  log(message: string, type: string): Promise<void>;
}

/** Representa um log de erro */
export interface ErrorLog {
  timestamp: number; 
  message: string;
  matchId?: string;
  stack?: string;
}