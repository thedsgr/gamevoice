import { Client, GuildMember, TextChannel } from 'discord.js';
import { db } from './db.js';

/**
 * Interface para entradas de log no banco de dados
 */
interface DBLogEntry {
  timestamp: Date;
  level: 'info' | 'warning' | 'error';
  message: string;
  context?: Record<string, unknown>;
  action?: string;
  details?: Record<string, unknown>;
}

/**
 * Interface para ações específicas do sistema
 */
interface SystemLogEntry {
  timestamp: Date;
  action: 'match_start' | 'match_end' | 'report' | 'link' | string;
  userId?: string;
  details: Record<string, unknown>;
  message: string; // Ensure message is always a string
}

/**
 * Classe Logger para gerenciamento centralizado de logs
 */
export class Logger {
    /**
     * Registra informações no console e opcionalmente no banco de dados
     */
    static info(message: string, context?: Record<string, unknown>) {
        this.Logger(message, 'INFO');
        this.logToDB('info', message, context);
    }

    /**
     * Registra avisos no console e opcionalmente no banco de dados
     */
    static warn(message: string, context?: Record<string, unknown>) {
        this.Logger(message, 'WARN');
        this.logToDB('warning', message, context);
    }

    /**
     * Registra erros no console, banco de dados e opcionalmente no canal de logs
     */
    static error(message: string, error?: Error, context?: Record<string, unknown>) {
        this.Logger(message, 'ERROR', error);
        this.logToDB('error', message, { 
            ...context, 
            error: error?.message,
            stack: error?.stack 
        });
    }

    /**
     * Registra mensagens de sucesso no console
     */
    static success(message: string) {
        this.Logger(message, 'SUCCESS');
        this.logToDB('info', message, { action: 'success' });
    }

    private static Logger(message: string, type: 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS', error?: Error) {
        const colors = {
            INFO: '\x1b[36m', // Cyan
            WARN: '\x1b[33m', // Yellow
            ERROR: '\x1b[31m', // Red
            SUCCESS: '\x1b[32m', // Green
        };
        const emoji = {
            INFO: 'ℹ️',
            WARN: '⚠️',
            ERROR: '❌',
            SUCCESS: '✅',
        };
        console.log(`${colors[type]}${emoji[type]} [${type}] ${message}\x1b[0m`);
        if (error) console.error(error);
    }

    private static logToDB(level: 'info' | 'warning' | 'error', message: string, context?: Record<string, unknown>) {
        if (!db.data) return;

        const logEntry: DBLogEntry = {
            timestamp: new Date(),
            level,
            message,
            context,
            action: typeof context?.action === 'string' ? context.action : 'default_action' // Ensure action is always a string
        };

        db.data.logs = db.data.logs || [];
        db.data.logs.push({
            ...logEntry,
            action: logEntry.action || 'default_action', // Ensure action is always a string
            details: logEntry.details || {} // Ensure details is always defined
        });

        db.write().catch((err) => {
            console.error('❌ Failed to save log to DB:', err);
        });
    }

    /**
     * Logs a message with a specific level.
     * @param message - The message to log.
     * @param level - The log level (e.g., 'INFO', 'ERROR').
     */
    log(message: string, level: string): void {
        console.log(`[${level}] ${message}`);
    }
}

/**
 * Envia uma mensagem para o canal de logs definido.
 */
export async function sendLog(client: Client, message: string, type: 'LOG' | 'MOD' | 'MATCH' = 'LOG'): Promise<void> {
    const logChannelId = db.data?.logChannelId;

    if (!logChannelId) {
        Logger.warn("Canal de logs não definido. Use o comando /setlog para configurá-lo.");
        return;
    }

    const logChannel = client.channels.cache.get(logChannelId) as TextChannel | undefined;

    if (!logChannel?.isTextBased()) {
        Logger.error("O canal de logs configurado não é válido ou não é um canal de texto.");
        return;
    }

    try {
        await logChannel.send(formatLogMessage(message, type));
    } catch (error) {
        Logger.error("Erro ao enviar mensagem para o canal de logs:", error instanceof Error ? error : new Error(String(error)));
    }
}

/**
 * Formata uma mensagem de log com emoji e tipo.
 */
export function formatLogMessage(message: string, type: 'LOG' | 'MOD' | 'MATCH' = 'LOG'): string {
    const emojiMap = {
        LOG: '📝',
        MOD: '⚠️', 
        MATCH: '🎮'
    };
    return `${emojiMap[type]} [${type}] ${message}`;
}

/**
 * Registra uma ação específica do sistema no banco de dados
 */
export function logSystemAction(action: string, details: Record<string, unknown>, userId?: string): void {
    if (!db.data) return;

    const entry: SystemLogEntry = {
        timestamp: new Date(),
        action,
        userId,
        details,
        message: `Action: ${action}` // Ensure message is always a string
    };

    db.data.systemLogs = db.data.systemLogs || [];
    db.data.systemLogs.push(entry);

    db.write().catch(err => {
        Logger.error("Falha ao registrar ação no sistema:", err);
    });

    Logger.info(`Ação do sistema registrada: ${action}`);
}