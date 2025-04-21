import { db } from './db.js';
/**
 * Envia uma mensagem para o canal de logs definido.
 * @param client - O cliente do bot.
 * @param message - A mensagem a ser enviada.
 * @param type - O tipo de log (LOG, MOD, MATCH, etc.).
 */
export async function sendLog(client, message, type = 'LOG') {
    const logChannelId = db.data?.logChannelId;
    if (!logChannelId) {
        logToConsole("⚠️ Canal de logs não definido. Use o comando /setlog para configurá-lo.", 'WARN');
        return;
    }
    const logChannel = client.channels.cache.get(logChannelId);
    if (!logChannel || !logChannel.isTextBased()) {
        logToConsole("❌ O canal de logs configurado não é válido ou não é um canal de texto.", 'ERROR');
        return;
    }
    const formattedMessage = formatLogMessage(message, type);
    try {
        await logChannel.send(formattedMessage);
    }
    catch (error) {
        logToConsole("❌ Erro ao enviar mensagem para o canal de logs:", 'ERROR');
        console.error(error);
    }
}
/**
 * Registra uma mensagem no console com um prefixo.
 */
export function logToConsole(message, type = 'INFO') {
    const emoji = type === 'INFO' ? 'ℹ️' : type === 'WARN' ? '⚠️' : '❌';
    console.log(`${emoji} [${type}] ${message}`);
}
/**
 * Registra um erro no banco de dados.
 */
export async function logErrorToDB(message) {
    db.data?.errors.push({
        timestamp: Date.now(),
        message,
    });
    await db.write();
    logToConsole(`Erro registrado no banco de dados: ${message}`, 'ERROR');
}
/**
 * Formata uma mensagem de log com emoji e tipo.
 */
export function formatLogMessage(message, type = 'LOG') {
    const emoji = type === 'LOG' ? '📝' : type === 'MOD' ? '⚠️' : type === 'MATCH' ? '🎮' : 'ℹ️';
    return `${emoji} [${type}] ${message}`;
}
//# sourceMappingURL=log.js.map