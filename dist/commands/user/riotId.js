import { SlashCommandBuilder } from '@discordjs/builders';
import { updateUser } from '../../utils/db.js';
import { isValidRiotId } from '../../utils/riotIdValidator.js';
const riotIdCommand = {
    data: new SlashCommandBuilder()
        .setName('linkriotid')
        .setDescription('Vincula seu Riot ID ao seu Discord.')
        .addStringOption(option => option
        .setName('riotid')
        .setDescription('Seu Riot ID no formato Nome#1234')
        .setRequired(true)), // Cast explícito para corrigir o tipo
    async execute(interaction) {
        const discordId = interaction.user.id;
        const riotId = interaction.options.getString('riotid', true).trim(); // Remove espaços extras
        // Valida o formato do Riot ID
        if (!isValidRiotId(riotId)) {
            try {
                await interaction.reply({
                    content: '❌ O Riot ID fornecido é inválido. Certifique-se de usar o formato Nome#1234.',
                    ephemeral: true,
                });
                return;
            }
            catch (error) {
                console.error('Erro ao responder à interação:', error);
            }
        }
        // Atualiza o usuário no banco de dados
        await updateUser({ discordId, riotId });
        await interaction.reply({
            content: `✅ Seu Riot ID \`${riotId}\` foi vinculado com sucesso!`,
            ephemeral: true,
        });
    },
};
export default riotIdCommand;
//# sourceMappingURL=riotId.js.map