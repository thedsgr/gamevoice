"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/commands/endmatch.ts
const builders_1 = require("@discordjs/builders");
const db_1 = require("../utils/db");
const endMatchCommand = {
    data: new builders_1.SlashCommandBuilder()
        .setName("endmatch")
        .setDescription("Finaliza a partida e limpa o canal de voz"),
    async execute(interaction) {
        const guild = interaction.guild;
        if (!guild) {
            await interaction.reply({
                content: "❌ Este comando só pode ser usado em um servidor.",
                ephemeral: true,
            });
            return;
        }
        try {
            const activeChannelId = db_1.db.data?.activeVoiceChannel;
            if (!activeChannelId) {
                await interaction.reply({
                    content: "❌ Não há nenhuma partida ativa no momento.",
                    ephemeral: true,
                });
                return;
            }
            const voiceChannel = guild.channels.cache.get(activeChannelId);
            if (!voiceChannel) {
                await interaction.reply({
                    content: "❌ O canal de voz não foi encontrado. Ele pode ter sido excluído.",
                    ephemeral: true,
                });
                db_1.db.data.activeVoiceChannel = undefined;
                await db_1.db.write();
                return;
            }
            await voiceChannel.delete("Partida finalizada");
            db_1.db.data.activeVoiceChannel = undefined;
            await db_1.db.write();
            await interaction.reply({
                content: "✅ Partida finalizada e canal de voz limpo.",
                ephemeral: true,
            });
        }
        catch (error) {
            console.error("❌ Erro ao finalizar a partida:", error);
            await interaction.reply({
                content: "❌ Ocorreu um erro ao finalizar a partida.",
                ephemeral: true,
            });
        }
    },
};
exports.default = endMatchCommand;
//# sourceMappingURL=endmatch.js.map