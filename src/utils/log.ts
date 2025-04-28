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

import { Client, TextChannel } from 'discord.js';
import db from '../utils/db.js'; // Corrigido para usar a exportação padrão
import { SystemLogEntry, DBLogEntry } from '../types/log.d.js';
import { ConsoleLogger } from './consoleLogger.js';
import { DBLogger } from './dbLogger.js';


/**
 * Classe Logger para gerenciamento centralizado de logs.
 * Registra logs no console, banco de dados e opcionalmente em canais de texto no Discord.
 */
export class Logger {
    static info(message: string, context?: Record<string, unknown>) {
        ConsoleLogger.log(message, 'INFO');
        DBLogger.log('info', message, context);
    }

    static warn(message: string, context?: Record<string, unknown>) {
        ConsoleLogger.log(message, 'WARN');
        DBLogger.log('warn', message, context);
    }

    static error(message: string, error?: Error, context?: Record<string, unknown>) {
        ConsoleLogger.log(message, 'ERROR', error);
        DBLogger.log('error', message, {
            ...context,
            error: error?.message,
            stack: error?.stack
        });
    }

    static success(message: string) {
        ConsoleLogger.log(message, 'SUCCESS');
        DBLogger.log('info', message, { action: 'success' });
    }

    static debug(message: string, context?: Record<string, unknown>) {
        ConsoleLogger.log(message, 'DEBUG');
        DBLogger.log('debug', message, context);
    }

    error(message: string, error?: Error): void {
        console.error(message, error);
    }

    debug(message: string): void {
        console.debug(message);
    }
}

/**
 * Envia uma mensagem para o canal de logs definido.
 * @param client - O cliente do bot.
 * @param message - A mensagem do log.
 * @param type - O tipo do log (LOG, MOD, MATCH).
 */
export async function sendLog(client: Client, message: string, type: 'LOG' | 'MOD' | 'MATCH' = 'LOG'): Promise<void> {
    const logChannelData = await db('settings').select('logChannelId').first() as { logChannelId: string } | undefined;
    const logChannelId = logChannelData?.logChannelId;

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
 * @param message - A mensagem do log.
 * @param type - O tipo do log (LOG, MOD, MATCH).
 * @returns A mensagem formatada.
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
    const entry: SystemLogEntry = {
        timestamp: new Date().getTime(),
        action,
        userId,
        details,
        message: `Action: ${action}`,
        level: 'info'
    };

    db('systemLogs')
        .insert({
            timestamp: entry.timestamp,
            action: entry.action,
            userId: entry.userId,
            details: JSON.stringify(entry.details),
            message: entry.message,
            level: entry.level
        })
        .catch((err: any) => {
            Logger.error("Falha ao registrar ação no sistema:", err);
        });

    Logger.info(`Ação do sistema registrada: ${action}`);

    Logger.info(`Ação do sistema registrada: ${action}`);
}