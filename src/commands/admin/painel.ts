import { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, PermissionFlagsBits, ButtonInteraction } from 'discord.js';
import { SlashCommand } from '../../structs/types/SlashCommand.js';
import {
  getActiveUsers,
  getTotalMatchesCreated,
  getTotalMatchesEndedByInactivity,
  getTotalReports,
  getPlayersKickedByReports,
  getLinkedRiotIds,
  getPlayersInCurrentMatch,
  getRecentErrors,
} from '../../services/monitor.js';

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
    const statusMessage = `
🧠 **Status do Bot**

- Usuários ativos (24h): ${getActiveUsers()}
- Partidas criadas: ${getTotalMatchesCreated()}
- Partidas encerradas por inatividade: ${getTotalMatchesEndedByInactivity()}
- Jogadores na call atual: ${getPlayersInCurrentMatch()}

🎯 **Monitoramento de Conta**

- Usuários com Riot ID: ${getLinkedRiotIds()}
- Total de denúncias: ${getTotalReports()}
- Jogadores expulsos: ${getPlayersKickedByReports()}

⚠️ **Últimos Erros**
${getRecentErrors().join('\n') || 'Nenhum erro registrado.'}
    `;

    await interaction.reply({
      content: statusMessage,
      ephemeral: true,
    });
  }
}

export default painelCommand;
