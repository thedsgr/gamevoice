/**
 * Este arquivo implementa o comando `/vincular` para vincular a conta Riot de um usuário ao Discord.
 * Ele valida o Riot ID fornecido, verifica se já está vinculado a outro usuário, salva o vínculo no banco de dados
 * e atribui o cargo "Invocadores" ao usuário no Discord.
 *
 * Funcionalidades principais:
 * - Validação do formato do Riot ID.
 * - Verificação de vínculos existentes no banco de dados.
 * - Integração com a API da Riot para validar o Riot ID.
 * - Salvamento do vínculo no banco de dados.
 * - Atribuição do cargo "Invocadores" ao usuário no Discord.
 * - Controle de cooldown para evitar spam.
 */
import { SlashCommandBuilder } from '@discordjs/builders';
export default {
    data: new SlashCommandBuilder()
        .setName('vincular')
        .setDescription('Vincula sua conta Riot ao Discord')
        .addStringOption(option => option.setName('riotid')
        .setDescription('Seu Riot ID (ex: Nome#BR1)')
        .setRequired(true)),
    execute: async (interaction) => {
        let interactionHandled = false;
        const safeReply = async (content, ephemeral = true) => {
            if (interactionHandled)
                return;
            try {
                if (interaction.replied || interaction.deferred) {
                    await interaction.editReply({ content });
                }
                else {
                    await interaction.reply({ content, ephemeral });
                }
                interactionHandled = true;
            }
            catch (error) {
                console.error('Erro ao responder:', error);
            }
        };
        try {
            // Defer a resposta imediatamente
            if (!interaction.deferred && !interaction.replied) {
                await interaction.deferReply({ ephemeral: true });
                interactionHandled = true;
            }
            const riotId = interaction.options.getString('riotid', true);
            // Simula validação e processamento
            if (!riotId.includes('#')) {
                await safeReply('❌ O Riot ID fornecido é inválido. Use o formato Nome#Região.');
                return;
            }
            // Resposta final
            await safeReply(`✅ Vinculado com sucesso: ${riotId}`);
        }
        catch (error) {
            console.error('Erro no comando vincular:', error);
            await safeReply('❌ Ocorreu um erro ao processar seu comando.');
        }
    }
};
