import { SlashCommandBuilder } from '@discordjs/builders';
import { ChannelType, PermissionsBitField } from 'discord.js';
import { db } from '../../utils/db.js';
const setLogChannel = {
    data: new SlashCommandBuilder()
        .setName("setlog")
        .setDescription("Define o canal de logs")
        .addChannelOption(opt => opt
        .setName("canal")
        .setDescription("Canal de texto para receber logs")
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)), // Cast explícito para corrigir o tipo
    async execute(interaction) {
        try {
            // Verifica se o usuário tem permissão de administrador
            if (!interaction.memberPermissions?.has(PermissionsBitField.Flags.Administrator)) {
                await interaction.reply({
                    content: "❌ Você não tem permissão para usar este comando.",
                    ephemeral: true,
                });
                return;
            }
            // Verifica se o banco de dados está inicializado
            if (!db.data) {
                await interaction.reply({
                    content: "❌ O banco de dados não está inicializado. Tente novamente mais tarde.",
                    ephemeral: true,
                });
                return;
            }
            // Obtém o canal selecionado
            const channel = interaction.options.getChannel("canal", true);
            // Verifica se o canal é de texto
            if (channel.type !== ChannelType.GuildText) {
                await interaction.reply({
                    content: "❌ O canal selecionado não é um canal de texto válido.",
                    ephemeral: true,
                });
                return;
            }
            // Salva o ID do canal no banco de dados
            db.data.logChannelId = channel.id;
            await db.write();
            // Responde ao usuário
            await interaction.reply({
                content: `✅ Canal de logs definido para ${channel.toString()}.`,
                ephemeral: true,
            });
        }
        catch (error) {
            if (error instanceof Error) {
                console.error(`[setlog] Erro ao definir o canal de logs: ${error.message}`, error);
            }
            else {
                console.error(`[setlog] Erro ao definir o canal de logs:`, error);
            }
            await interaction.reply({
                content: "❌ Ocorreu um erro ao tentar definir o canal de logs. Tente novamente mais tarde.",
                ephemeral: true,
            });
        }
    },
};
export default setLogChannel;
