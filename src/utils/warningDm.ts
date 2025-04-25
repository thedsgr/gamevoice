import { GuildMember } from 'discord.js';
import { Logger } from './log.js';

/**
 * Este arquivo implementa a função `sendWarningDM`, que envia uma mensagem direta (DM) de aviso
 * para um membro do Discord. A mensagem pode incluir um motivo e um link para as regras do servidor.
 * 
 * Funcionalidades principais:
 * - Enviar uma mensagem de aviso personalizada para um membro do Discord.
 * - Incluir um motivo opcional e um link para as regras do servidor.
 * - Tratar erros ao enviar a mensagem e registrar logs no console.
 */

interface WarningDMOptions {
  reason?: string;
  rulesLink?: string;
}

/**
 * Envia uma mensagem direta (DM) de aviso para um membro do Discord.
 * @param member - O membro que receberá o aviso.
 * @param options - Opções para personalizar a mensagem (motivo e link para as regras).
 * @returns `true` se o envio foi bem-sucedido, caso contrário `false`.
 */
export async function sendWarningDM(
  member: GuildMember,
  options: WarningDMOptions = {}
): Promise<boolean> {
  try {
    if (!member.user) {
      Logger.warn('O membro fornecido não possui um usuário associado.');
      return false;
    }

    let message = '⚠️ **Aviso Formal**\n\n';
    message += 'Você recebeu um aviso por comportamento inadequado no servidor.\n';
    
    if (options.reason) {
      message += `\n**Motivo:** ${options.reason}\n`;
    }
    
    message += '\nContinuar com essa conduta pode resultar em punições mais severas.';
    
    if (options.rulesLink) {
      message += `\n\nPor favor, revise as regras: ${options.rulesLink}`;
    } else {
      message += '\n\nPor favor, revise as regras do servidor.';
    }

    await member.send(message);
    Logger.info(`Aviso enviado para ${member.user.tag} (ID: ${member.id}).`);
    return true; // Indica que o envio foi bem-sucedido
  } catch (error) {
    if (member.user) {
      Logger.error(
        `Falha ao enviar DM para ${member.user.tag} (ID: ${member.id}):`
      );
      const errorMessage = error instanceof Error ? error : new Error(String(error));
      Logger.error(`Falha ao enviar DM para ${member.user.tag} (ID: ${member.id}):`, errorMessage);
    } else {
      Logger.error(
        `Falha ao enviar DM: O membro não possui um usuário associado.`,
        error instanceof Error ? error : new Error(String(error))
      );
    }
    return false; // Indica que o envio falhou
  }
}