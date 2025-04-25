// Este arquivo implementa o comando `/desvincular`, que permite aos usuários removerem
// a vinculação de suas contas Riot ID do banco de dados. Ele também registra um log
// da ação para fins de auditoria.
import { SlashCommandBuilder } from '@discordjs/builders';
import { MessageFlags } from 'discord.js';
import { updateUser } from '../../services/users.js';
import { sendLog } from '../../utils/log.js';
export default {
    data: new SlashCommandBuilder()
        .setName('desvincular') // Nome do comando em minúsculas
        .setDescription('Desvincular seu Riot ID do banco de dados.')
        .addStringOption(option => option
        .setName('riotid')
        .setDescription('Seu Riot ID (ex: nome#BR1)')
        .setRequired(true)
        .setMaxLength(30) // Limite razoável
        .setMinLength(3) // Mínimo para nome#tag
    ),
    async execute(interaction) {
        const discordId = interaction.user.id;
        try {
            // Remove o Riot ID do banco de dados
            await updateUser({ discordId, riotId: null });
            await interaction.reply({
                content: '✅ Seu Riot ID foi removido com sucesso!',
                flags: MessageFlags.Ephemeral,
            });
            // Log de remoção
            await sendLog(interaction.client, `📝 [LOG] O usuário ${interaction.user.tag} desvinculou o Riot ID.`, 'LOG');
        }
        catch (error) {
            console.error('Erro ao desvincular Riot ID:', error);
            await interaction.reply({
                content: '❌ Ocorreu um erro ao tentar desvincular seu Riot ID. Tente novamente mais tarde.',
                flags: MessageFlags.Ephemeral,
            });
        }
    },
};
