import { GuildMember } from 'discord.js';

// warningDM.ts
interface WarningDMOptions {
    reason?: string;
    rulesLink?: string;
  }
  
  export async function sendWarningDM(
    member: GuildMember,
    options: WarningDMOptions = {}
  ): Promise<void> {
    try {
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
    } catch (error) {
      console.error(`Failed to send DM to ${member.user.tag}:`, error);
    }
  }