import type { ChatInputCommandInteraction } from "discord.js";
import type { SlashCommandBuilder } from "@discordjs/builders";

/**
 * Representa um comando de slash no Discord.
 */
export interface SlashCommand {
  /**
   * Estrutura do comando, incluindo nome, descrição e opções.
   */
  data: SlashCommandBuilder;

  /**
   * Função executada quando o comando é chamado.
   * @param interaction - A interação do comando de slash.
   */
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}
