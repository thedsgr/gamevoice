// src/commands/endmatch.ts
import { SlashCommandBuilder } from 'discord.js';
const endMatchCommand = {
    data: new SlashCommandBuilder()
        .setName("endmatch")
        .setDescription("Finaliza a partida e limpa os canais de voz"),
    async execute(interaction) {
        try {
            await interaction.deferReply({ ephemeral: true });
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
//# sourceMappingURL=endmatch.js.map