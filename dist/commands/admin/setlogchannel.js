import { SlashCommandBuilder } from '@discordjs/builders';
import { ChannelType } from 'discord-api-types/v10';
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
            if (!interaction.memberPermissions?.has("Administrator")) {
                await interaction.reply({
                    content: "❌ Você não tem permissão para usar este comando.",
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
            console.error("Erro ao executar o comando setlog:", error);
            await interaction.reply({
                content: "❌ Ocorreu um erro ao tentar definir o canal de logs. Tente novamente mais tarde.",
                ephemeral: true,
            });
        }
    },
};
export default setLogChannel;
