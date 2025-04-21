import { SlashCommandBuilder } from '@discordjs/builders';
import { updateUser } from '../../utils/db.js';
const unlinkRiotIdCommand = {
    data: new SlashCommandBuilder()
        .setName('desvincular')
        .setDescription('Desvincula seu Riot ID do seu Discord.'),
    async execute(interaction) {
        const discordId = interaction.user.id;
        try {
            // Atualiza o usuário no banco de dados, removendo o Riot ID
            await updateUser({ discordId, riotId: null });
            // Responde ao usuário
            await interaction.reply({
                content: '✅ Seu Riot ID foi desvinculado com sucesso!',
                ephemeral: true,
            });
        }
        catch (error) {
            console.error(`❌ Erro ao desvincular Riot ID para o usuário ${discordId}:`, error);
            await interaction.reply({
                content: '❌ Ocorreu um erro ao tentar desvincular seu Riot ID. Tente novamente mais tarde.',
                ephemeral: true,
            });
        }
    },
};
export default unlinkRiotIdCommand;
//# sourceMappingURL=unlinkRiotId.js.map