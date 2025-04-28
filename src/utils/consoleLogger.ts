/**
 * Módulo para gerenciamento de logs no console.
 * Este módulo é responsável por formatar e exibir mensagens no console com cores e emojis.
 */

export class ConsoleLogger {
    static log(message: string, type: 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS' | 'DEBUG', error?: Error) {
        const colors = {
            INFO: '\x1b[36m', // Cyan
            WARN: '\x1b[33m', // Yellow
            ERROR: '\x1b[31m', // Red
            SUCCESS: '\x1b[32m', // Green
            DEBUG: '\x1b[35m', // Magenta
        };
        const emoji = {
            INFO: 'ℹ️',
            WARN: '⚠️',
            ERROR: '❌',
            SUCCESS: '✅',
            DEBUG: '🐛',
        };
        console.log(`${colors[type]}${emoji[type]} [${type}] ${message}\x1b[0m`);
        if (error) console.error(error);
    }
}