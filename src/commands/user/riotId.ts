import { SlashCommandBuilder } from 'discord.js';
import { ChatInputCommandInteraction } from 'discord.js';
import { updateUser } from '../../services/users.js';
import { isValidRiotId } from '../../utils/riotIdValidator.js';
import { sendLog } from '../../utils/log.js';

/** Função utilitária para vincular o Riot ID ao Discord */
async function linkRiotId(discordId: string, riotId: string): Promise<void> {
  await updateUser({ discordId, riotId });
}

const riotIdCommand = {
  data: new SlashCommandBuilder()
    .setName('linkriotid')
    .setDescription('Vincula seu Riot ID ao seu Discord.')
    .addStringOption(option =>
      option
        .setName('riotid')
        .setDescription('Seu Riot ID no formato Nome#1234')
        .setRequired(true)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const discordId = interaction.user.id;
    const riotId = interaction.options.getString('riotid', true).trim();

    // Valida o formato do Riot ID
    if (!isValidRiotId(riotId)) {
      await interaction.reply({
        content: '❌ O Riot ID fornecido é inválido. Certifique-se de usar o formato Nome#1234.',
        ephemeral: true,
      });
      return;
    }

    try {
      // Atualiza o usuário no banco de dados
      await linkRiotId(discordId, riotId);

      // Responde ao usuário
      await interaction.reply({
        content: `✅ Seu Riot ID \`${riotId}\` foi vinculado com sucesso!`,
        ephemeral: true,
      });

      // Log de vinculação
      await sendLog(
        interaction.client,
        `📝 [LOG] ${interaction.user.tag} vinculou o Riot ID: ${riotId}.`,
        'LOG'
      );
    } catch (error) {
      console.error('❌ Erro ao vincular Riot ID:', error);
      await interaction.reply({
        content: '❌ Ocorreu um erro ao vincular seu Riot ID. Tente novamente mais tarde.',
        ephemeral: true,
      });
    }
  },
};

export default riotIdCommand;