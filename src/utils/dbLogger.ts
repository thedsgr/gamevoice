/**
 * Módulo para gerenciamento de logs no banco de dados.
 * Este módulo é responsável por registrar logs no banco de dados para auditoria e análise.
 */

import db from './db.js'; // Corrigido para usar a exportação padrão
import { DBLogEntry } from '../types/log.d.js';

export class DBLogger {
    static log(level: 'info' | 'warn' | 'error' | 'debug', message: string, context?: Record<string, unknown>) {
        if (level === 'debug') {
            // Registrar logs de depuração, se necessário
            console.debug(`[DB DEBUG] ${message}`, context);
            return;
        }

        const logEntry: DBLogEntry = {
            timestamp: Date.now(),
            level,
            message,
            context,
            action: typeof context?.action === 'string' ? context.action : 'default_action'
        };

        db('logs')
            .insert(logEntry)
            .catch((err: any) => {
                console.error('❌ Failed to save log to DB:', err);
            });
    }
}