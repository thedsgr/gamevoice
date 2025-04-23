import { SlashCommandBuilder } from '@discordjs/builders';
import { ChatInputCommandInteraction } from 'discord.js';
import { SlashCommand } from '../../structs/types/SlashCommand.js';
import { updateUser } from '../../services/users.js';
import { sendLog } from '../../utils/log.js';

const unlinkRiotIdCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('Desvincular-RiotID')
    .setDescription('Remove a vinculação do seu Riot ID.'),

  async execute(interaction: ChatInputCommandInteraction) {
    const discordId = interaction.user.id;

    // Remove o Riot ID do banco de dados
    await updateUser({ discordId, riotId: null });
    await interaction.reply({
      content: '✅ Seu Riot ID foi removido com sucesso!',
      ephemeral: true,
    });

    // Log de remoção
    await sendLog(
      interaction.client,
      `📝 [LOG] ${interaction.user.tag} desvinculou o Riot ID.`,
      'LOG'
    );
  },
};

export default unlinkRiotIdCommand;