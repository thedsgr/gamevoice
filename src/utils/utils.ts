import { Logger } from './log.js';

/**
 * Gera um ID único para a partida.
 * @returns ID único.
 */
export function generateMatchId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

/**
 * Centraliza a validação de variáveis de ambiente.
 * @param requiredVars - Lista de variáveis de ambiente obrigatórias.
 */
export function validateEnvVars(requiredVars: string[]): void {
  const missingVars = requiredVars.filter((key) => !process.env[key]);
  if (missingVars.length > 0) {
    Logger.error(`As seguintes variáveis de ambiente estão ausentes: ${missingVars.join(', ')}`);
    throw new Error(`Configuração inválida. Verifique o arquivo .env e tente novamente.`);
  }
}

/**
 * Centraliza o registro de logs de sucesso, erro e informações.
 * @param level - Nível do log (info, success, error).
 * @param message - Mensagem a ser registrada.
 */
export function logMessage(level: 'info' | 'success' | 'error', message: string): void {
  switch (level) {
    case 'info':
      Logger.info(message);
      break;
    case 'success':
      Logger.success(message);
      break;
    case 'error':
      Logger.error(message);
      break;
    default:
      throw new Error('Nível de log inválido.');
  }
}