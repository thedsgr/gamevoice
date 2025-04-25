/**
 * Este arquivo contém a implementação da classe `Logger` e funções auxiliares para gerenciamento centralizado de logs.
 * Ele permite registrar logs no console, no banco de dados e, opcionalmente, em canais de texto no Discord.
 *
 * Funcionalidades principais:
 * - Registrar logs de diferentes níveis (info, warn, error, success) no console.
 * - Salvar logs no banco de dados para auditoria e análise.
 * - Enviar logs para canais de texto no Discord.
 * - Formatar mensagens de log com emojis e cores para facilitar a leitura.
 */
import { db } from './db.js';
/**
 * Classe Logger para gerenciamento centralizado de logs.
 * Registra logs no console, banco de dados e opcionalmente em canais de texto no Discord.
 */
export class Logger {
    /**
     * Registra informações no console e opcionalmente no banco de dados.
     * @param message - A mensagem do log.
     * @param context - Contexto adicional para o log.
     */
    static info(message, context) {
        this.logToConsole(message, 'INFO');
        this.logToDB('info', message, context);
    }
    /**
     * Registra avisos no console e opcionalmente no banco de dados.
     * @param message - A mensagem do log.
     * @param context - Contexto adicional para o log.
     */
    static warn(message, context) {
        this.logToConsole(message, 'WARN');
        this.logToDB('warn', message, context);
    }
    /**
     * Registra erros no console, banco de dados e opcionalmente no canal de logs.
     * @param message - A mensagem do log.
     * @param error - O erro associado ao log.
     * @param context - Contexto adicional para o log.
     */
    static error(message, error, context) {
        this.logToConsole(message, 'ERROR', error);
        this.logToDB('error', message, {
            ...context,
            error: error?.message,
            stack: error?.stack
        });
    }
    /**
     * Registra mensagens de sucesso no console.
     * @param message - A mensagem do log.
     */
    static success(message) {
        this.logToConsole(message, 'SUCCESS');
        this.logToDB('info', message, { action: 'success' });
    }
    /**
     * Registra uma mensagem no console com formatação de cor e emoji.
     * @param message - A mensagem do log.
     * @param type - O tipo do log (INFO, WARN, ERROR, SUCCESS).
     * @param error - O erro associado ao log (opcional).
     */
    static logToConsole(message, type, error) {
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
    /**
     * Registra um log no banco de dados.
     * @param level - O nível do log (info, warn, error).
     * @param message - A mensagem do log.
     * @param context - Contexto adicional para o log.
     */
    static logToDB(level, message, context) {
        if (!db.data)
            return;
        const logEntry = {
            timestamp: Date.now(),
            level,
            message,
            context,
            action: typeof context?.action === 'string' ? context.action : 'default_action'
        };
        db.data.logs = db.data.logs || [];
        db.data.logs.push(logEntry);
        db.write().catch((err) => {
            console.error('❌ Failed to save log to DB:', err);
        });
    }
    error(message, error) {
        console.error(`[ERROR] ${message}`, error);
    }
}
/**
 * Envia uma mensagem para o canal de logs definido.
 * @param client - O cliente do bot.
 * @param message - A mensagem do log.
 * @param type - O tipo do log (LOG, MOD, MATCH).
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
 * @param message - A mensagem do log.
 * @param type - O tipo do log (LOG, MOD, MATCH).
 * @returns A mensagem formatada.
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
        timestamp: new Date().getTime(),
        action,
        userId,
        details,
        message: `Action: ${action}`,
        level: 'info'
    };
    db.data.systemLogs = db.data.systemLogs || [];
    db.data.systemLogs.push({
        ...entry,
        timestamp: entry.timestamp,
        level: 'info'
    });
    db.write().catch(err => {
        Logger.error("Falha ao registrar ação no sistema:", err);
    });
    Logger.info(`Ação do sistema registrada: ${action}`);
}
