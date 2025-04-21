// src/commands/endmatch.ts
import { SlashCommandBuilder } from '@discordjs/builders';
import { PermissionFlagsBits } from 'discord.js';
import { db } from '../../utils/db.js';
const endMatchCommand = {
    data: new SlashCommandBuilder()
        .setName("endmatch")
        .setDescription("Finaliza a partida e limpa os canais de voz")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator), // Apenas administradores podem usar
    async execute(interaction) {
        const guild = interaction.guild;
        if (!guild) {
            await interaction.reply({
                content: "❌ Este comando só pode ser usado em um servidor.",
                ephemeral: true,
            });
            return;
        }
        if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
            await interaction.reply({
                content: "❌ Você não tem permissão para usar este comando.",
                ephemeral: true,
            });
            return;
        }
        try {
            await interaction.deferReply({ ephemeral: true });
            // Lógica para finalizar a partida e limpar os canais
            // Exemplo: deletar o canal de voz ativo
            const activeChannelId = db.data?.activeVoiceChannel;
            if (activeChannelId) {
                const activeChannel = guild.channels.cache.get(activeChannelId);
                if (activeChannel?.isVoiceBased()) {
                    await activeChannel.delete();
                    db.data.activeVoiceChannel = undefined;
                    await db.write();
                    await interaction.editReply({
                        content: "✅ Partida finalizada e canal de voz limpo.",
                    });
                }
                else {
                    await interaction.editReply({
                        content: "⚠️ Nenhum canal de voz ativo encontrado.",
                    });
                }
            }
            else {
                await interaction.editReply({
                    content: "⚠️ Nenhum canal de voz ativo encontrado.",
                });
            }
        }
        catch (error) {
            console.error("❌ Erro ao executar o comando endmatch:", error);
            await interaction.editReply({
                content: "❌ Ocorreu um erro ao finalizar a partida.",
            });
        }
    },
};
export default endMatchCommand;
//# sourceMappingURL=endmatch.js.map