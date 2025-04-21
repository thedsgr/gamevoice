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
        console.warn("⚠️ Canal de logs não definido. Use o comando /setlog para configurá-lo.");
        return;
    }
    const logChannel = client.channels.cache.get(logChannelId);
    if (!logChannel || !logChannel.isTextBased()) {
        console.error("❌ O canal de logs configurado não é válido ou não é um canal de texto.");
        return;
    }
    const emoji = type === 'LOG' ? '📝' : type === 'MOD' ? '⚠️' : type === 'MATCH' ? '🎮' : 'ℹ️';
    const formattedMessage = `${emoji} [${type}] ${message}`;
    try {
        await logChannel.send(formattedMessage);
    }
    catch (error) {
        console.error("❌ Erro ao enviar mensagem para o canal de logs:", error);
    }
}
//# sourceMappingURL=log.js.map