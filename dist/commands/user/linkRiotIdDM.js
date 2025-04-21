import { SlashCommandBuilder } from '@discordjs/builders';
import { sendLog } from '../../utils/log.js';
const linkRiotIdDMCommand = {
    data: new SlashCommandBuilder()
        .setName('linkriotiddm')
        .setDescription('Receba um link para vincular seu Riot ID via DM.'),
    async execute(interaction) {
        const user = interaction.user;
        try {
            // Envia uma mensagem na DM do usuário
            await user.send('🔗 Clique no link abaixo para vincular seu Riot ID ao seu Discord:\n' +
                'https://example.com/link-riot-id');
            // Responde ao usuário no canal público
            await interaction.reply({
                content: '✅ Verifique sua DM para o link de vinculação!',
                ephemeral: true,
            });
            // Log de envio de link
            await sendLog(interaction.client, `📝 [LOG] ${interaction.user.tag} solicitou o link de vinculação via DM.`, 'LOG');
        }
        catch (error) {
            console.error(`❌ Erro ao enviar DM para o usuário ${user.tag}:`, error);
            await interaction.reply({
                content: '❌ Não foi possível enviar uma DM para você. Certifique-se de que suas DMs estão ativadas.',
                ephemeral: true,
            });
        }
    },
};
export default linkRiotIdDMCommand;
//# sourceMappingURL=linkRiotIdDM.js.map