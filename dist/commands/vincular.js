import { SlashCommandBuilder } from '@discordjs/builders';
import { updateUser } from '../utils/db.js';
const vincularCommand = {
    data: new SlashCommandBuilder()
        .setName('vincular')
        .setDescription('Vincula sua conta Riot ao seu Discord')
        .addStringOption(option => option
        .setName('riotid')
        .setDescription('Seu Riot ID (ex: nome#BR1)')
        .setRequired(true)), // Cast explícito para corrigir o tipo
    async execute(interaction) {
        const discordId = interaction.user.id;
        const riotId = interaction.options.getString('riotid', true);
        try {
            // Atualiza o usuário no banco de dados
            await linkRiotAccount(discordId, riotId);
            // Responde ao usuário
            await interaction.reply({
                content: `✅ Sua conta Riot \`${riotId}\` foi vinculada com sucesso!`,
                ephemeral: true,
            });
        }
        catch (error) {
            console.error('❌ Erro ao vincular conta Riot:', error);
            await interaction.reply({
                content: '❌ Ocorreu um erro ao tentar vincular sua conta Riot. Tente novamente mais tarde.',
                ephemeral: true,
            });
        }
    },
};
/**
 * Atualiza o banco de dados para vincular a conta Riot ao Discord ID.
 */
async function linkRiotAccount(discordId, riotId) {
    await updateUser({ discordId, riotId });
    console.log(`🔗 Conta Riot ${riotId} vinculada ao Discord ID ${discordId}`);
}
export default vincularCommand;
//# sourceMappingURL=vincular.js.map