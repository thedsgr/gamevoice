import { GuildMember } from 'discord.js';

// warningDM.ts
interface WarningDMOptions {
  reason?: string;
  rulesLink?: string;
}

export async function sendWarningDM(
  member: GuildMember,
  options: WarningDMOptions = {}
): Promise<boolean> {
  try {
    if (!member.user) {
      console.error('O membro fornecido não possui um usuário associado.');
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
    return true; // Indica que o envio foi bem-sucedido
  } catch (error) {
    console.error(`Falha ao enviar DM para ${member.user.tag} (ID: ${member.id}):`, error);
    return false; // Indica que o envio falhou
  }
}