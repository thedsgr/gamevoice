import { Client, TextChannel } from 'discord.js';
import { db } from './db.js';

/**
 * Envia uma mensagem para o canal de logs definido.
 * @param client - O cliente do bot.
 * @param message - A mensagem a ser enviada.
 * @param type - O tipo de log (LOG, MOD, MATCH, etc.).
 */
export async function sendLog(client: Client, message: string, type: 'LOG' | 'MOD' | 'MATCH' = 'LOG'): Promise<void> {
  const logChannelId = db.data?.logChannelId;

  if (!logChannelId) {
    logToConsole("⚠️ Canal de logs não definido. Use o comando /setlog para configurá-lo.", 'WARN');
    return;
  }

  const logChannel = client.channels.cache.get(logChannelId) as TextChannel;

  if (!logChannel || !logChannel.isTextBased()) {
    logToConsole("❌ O canal de logs configurado não é válido ou não é um canal de texto.", 'ERROR');
    return;
  }

  const formattedMessage = formatLogMessage(message, type);

  try {
    await logChannel.send(formattedMessage);
  } catch (error) {
    logToConsole("❌ Erro ao enviar mensagem para o canal de logs:", 'ERROR');
    console.error(error);
  }
}

/**
 * Registra uma mensagem no console com um prefixo.
 */
export function logToConsole(message: string, type: 'INFO' | 'WARN' | 'ERROR' = 'INFO'): void {
  const emoji = type === 'INFO' ? 'ℹ️' : type === 'WARN' ? '⚠️' : '❌';
  console.log(`${emoji} [${type}] ${message}`);
}

/**
 * Registra um erro no banco de dados.
 */
export async function logErrorToDB(message: string): Promise<void> {
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
export function formatLogMessage(message: string, type: 'LOG' | 'MOD' | 'MATCH' = 'LOG'): string {
  const emoji = type === 'LOG' ? '📝' : type === 'MOD' ? '⚠️' : type === 'MATCH' ? '🎮' : 'ℹ️';
  return `${emoji} [${type}] ${message}`;
}
