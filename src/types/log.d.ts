/**
 * Este arquivo define as interfaces e tipos relacionados ao sistema de logs do projeto.
 * Ele é usado para padronizar a estrutura de logs de ações, logs do sistema e logs de erros,
 * além de fornecer uma classe `Logger` para registrar logs no banco de dados ou em outros destinos.
 * 
 * Funcionalidades principais:
 * - Definir interfaces para diferentes tipos de logs (ação, sistema, erro).
 * - Padronizar a estrutura de logs no projeto.
 * - Fornecer uma classe `Logger` para registrar logs.
 */

import { Log } from '../utils/log.ts';

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
  action: 'match_start' | 'match_end' | 'report' | 'link' | string;
  userId?: string;
  details?: Record<string, unknown>;
  type?: string;
  reason?: string;
  error?: string;
}

/** Representa um log de erro */
export interface ErrorLog {
  timestamp: number;
  message: string;
  matchId?: string;
  stack?: string;
}

/** Representa um log armazenado no banco de dados */
export interface DBLogEntry {
  timestamp: number;
  level: 'info' | 'warn' | 'error';
  message: string;
  context?: Record<string, unknown>;
  action?: string;
  details?: Record<string, unknown>;
}