import { SlashCommandBuilder } from '@discordjs/builders';
import { ChatInputCommandInteraction } from 'discord.js';
import { SlashCommand } from '../../structs/types/SlashCommand.js';

const linkRiotIdDMCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('vincular')
    .setDescription('Receba um link para vincular seu Riot ID via DM.'),

  async execute(interaction: ChatInputCommandInteraction) {
    const user = interaction.user;

    try {
      // Envia uma mensagem na DM do usuário
      await user.send(
        '🔗 Clique no link abaixo para vincular seu Riot ID ao seu Discord:\n' +
        'https://example.com/link-riot-id'
      );

      // Responde ao usuário no canal público
      await interaction.reply({
        content: '✅ Verifique sua DM para o link de vinculação!',
        ephemeral: true,
      });
    } catch (error) {
      console.error(`❌ Erro ao enviar DM para o usuário ${user.tag}:`, error);
      await interaction.reply({
        content: '❌ Não foi possível enviar uma DM para você. Certifique-se de que suas DMs estão ativadas.',
        ephemeral: true,
      });
    }
  },
};

export default linkRiotIdDMCommand;