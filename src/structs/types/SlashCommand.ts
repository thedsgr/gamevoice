// Este arquivo define a interface `SlashCommand`, que padroniza a estrutura e o comportamento
// dos comandos de slash no Discord. Ele garante que todos os comandos implementem a estrutura
// necessária e forneçam uma função de execução.

import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction } from 'discord.js';

/**
 * Representa um comando de slash no Discord.
 * Todos os comandos devem implementar esta interface.
 */
export type SlashCommand = {
  /**
   * Estrutura do comando, incluindo nome, descrição e opções.
   * Utiliza o `SlashCommandBuilder` para definir a configuração do comando.
   */
  data: SlashCommandBuilder;

  /**
   * Função executada quando o comando é chamado.
   * @param interaction - A interação do comando de slash.
   */
  execute: (interaction: CommandInteraction) => Promise<void>;
};
