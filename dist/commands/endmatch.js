// src/commands/endmatch.ts
import { SlashCommandBuilder, PermissionsBitField } from 'discord.js';
const endMatchCommand = {
    data: new SlashCommandBuilder()
        .setName("endmatch")
        .setDescription("Finaliza a partida e limpa os canais de voz"),
    async execute(interaction) {
        try {
            await interaction.deferReply({ ephemeral: true });
            const member = interaction.member;
            if (!member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
                console.log("O membro não tem permissão para gerenciar canais ou é nulo.");
                await interaction.editReply('❌ Você não tem permissão para finalizar a partida.');
                return;
            }
            // Lógica do comando
            await interaction.editReply('✅ Partida finalizada com sucesso!');
        }
        catch (error) {
            console.error('❌ Erro ao executar o comando endmatch:', error);
            await interaction.editReply('❌ Ocorreu um erro ao finalizar a partida.');
        }
    },
};
export default endMatchCommand;
