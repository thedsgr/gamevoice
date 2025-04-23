import { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, PermissionFlagsBits, ButtonInteraction } from 'discord.js';
import { SlashCommand } from '../../structs/types/SlashCommand.js';
import {
  getActiveUsers,
  getTotalMatchesCreated,
  getTotalMatchesEndedByInactivity,
  getTotalMatchesEndedByPlayers,
  getPlayersKickedByReports,
  getLinkedRiotIds,
  getPlayersInCurrentMatch,
  getRecentErrors,
} from '../../utils/db.js';

const painelCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('painel')
    .setDescription('Exibe o painel de administração')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction: ChatInputCommandInteraction) {
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('status_bot')
        .setLabel('🔍 Ver status')
        .setStyle(ButtonStyle.Primary),

      new ButtonBuilder()
        .setCustomId('forcar_start')
        .setLabel('🟢 Iniciar Partida')
        .setStyle(ButtonStyle.Success),

      new ButtonBuilder()
        .setCustomId('forcar_end')
        .setLabel('🔴 Encerrar Partida')
        .setStyle(ButtonStyle.Danger)
    );

    await interaction.reply({
      content: "🛠️ **Painel de Administração**\nEscolha uma opção:",
      components: [row],
      ephemeral: true,
    });
  },
};

export async function handleButtonInteraction(interaction: ButtonInteraction) {
  if (interaction.customId === 'status_bot') {
    try {
      const activeUsers = await getActiveUsers();
      const totalMatchesCreated = await getTotalMatchesCreated();
      const totalMatchesEndedByInactivity = await getTotalMatchesEndedByInactivity();
      const playersInCurrentMatch = await getPlayersInCurrentMatch();
      const linkedRiotIds = await getLinkedRiotIds();
      const playersKickedByReports = await getPlayersKickedByReports();
      const recentErrors = (await getRecentErrors()) || [];

      const statusMessage = `
🧠 **Status do Bot**

- Usuários ativos (24h): ${activeUsers}
- Partidas criadas: ${totalMatchesCreated}
- Partidas encerradas por inatividade: ${totalMatchesEndedByInactivity}
- Jogadores na call atual: ${playersInCurrentMatch}

🎯 **Monitoramento de Conta**

- Usuários com Riot ID: ${linkedRiotIds}
- Jogadores expulsos: ${playersKickedByReports}

⚠️ **Últimos Erros**
${recentErrors.join('\n') || 'Nenhum erro registrado.'}
      `;

      await interaction.reply({
        content: statusMessage,
        ephemeral: true,
      });
    } catch (error) {
      console.error('Erro ao obter status do bot:', error);
      await interaction.reply({
        content: '❌ Ocorreu um erro ao obter o status do bot. Tente novamente mais tarde.',
        ephemeral: true,
      });
    }
  }
}

export default painelCommand;
