import { db } from './db.js';
/**
 * Classe Logger para gerenciamento centralizado de logs
 */
export class Logger {
    /**
     * Registra informações no console e opcionalmente no banco de dados
     */
    static info(message, context) {
        this.Logger(message, 'INFO');
        this.logToDB('info', message, context);
    }
    /**
     * Registra avisos no console e opcionalmente no banco de dados
     */
    static warn(message, context) {
        this.Logger(message, 'WARN');
        this.logToDB('warning', message, context);
    }
    /**
     * Registra erros no console, banco de dados e opcionalmente no canal de logs
     */
    static error(message, error, context) {
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
    static success(message) {
        this.Logger(message, 'SUCCESS');
        this.logToDB('info', message, { action: 'success' });
    }
    static Logger(message, type, error) {
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
        if (error)
            console.error(error);
    }
    static logToDB(level, message, context) {
        if (!db.data)
            return;
        const logEntry = {
            timestamp: new Date(),
            level,
            message,
            context,
            action: typeof context?.action === 'string' ? context.action : 'default_action'
        };
        db.data.logs = db.data.logs || [];
        db.data.logs.push({
            ...logEntry,
            timestamp: logEntry.timestamp.getTime(), // Convert Date to number
            action: logEntry.action || 'default_action',
            details: logEntry.details || {}
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
    log(message, level) {
        console.log(`[${level}] ${message}`);
    }
}
/**
 * Envia uma mensagem para o canal de logs definido.
 */
export async function sendLog(client, message, type = 'LOG') {
    const logChannelId = db.data?.logChannelId;
    if (!logChannelId) {
        Logger.warn("Canal de logs não definido. Use o comando /setlog para configurá-lo.");
        return;
    }
    const logChannel = client.channels.cache.get(logChannelId);
    if (!logChannel?.isTextBased()) {
        Logger.error("O canal de logs configurado não é válido ou não é um canal de texto.");
        return;
    }
    try {
        await logChannel.send(formatLogMessage(message, type));
    }
    catch (error) {
        Logger.error("Erro ao enviar mensagem para o canal de logs:", error instanceof Error ? error : new Error(String(error)));
    }
}
/**
 * Formata uma mensagem de log com emoji e tipo.
 */
export function formatLogMessage(message, type = 'LOG') {
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
export function logSystemAction(action, details, userId) {
    if (!db.data)
        return;
    const entry = {
        timestamp: new Date(),
        action,
        userId,
        details,
        message: `Action: ${action}`
    };
    db.data.systemLogs = db.data.systemLogs || [];
    db.data.systemLogs.push({
        ...entry,
        timestamp: entry.timestamp.getTime(),
        level: 'info'
    });
    db.write().catch(err => {
        Logger.error("Falha ao registrar ação no sistema:", err);
    });
    Logger.info(`Ação do sistema registrada: ${action}`);
}
