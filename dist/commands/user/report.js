// Este comando implementa o `/report`, permitindo que os usuários denunciem comportamentos
// inadequados de outros jogadores. Ele registra a denúncia com base no motivo selecionado
// e utiliza o `PunishmentManager` para processar a ação, garantindo que as denúncias sejam
// tratadas de forma eficiente e segura.
import { SlashCommandBuilder } from '@discordjs/builders';
import { MessageFlags } from 'discord.js';
import { PunishmentManager } from '../../services/punishment/core/punishmentManager.js';
const reportCommand = {
    data: new SlashCommandBuilder()
        .setName('report')
        .setDescription('Denunciar comportamento agressivo de um jogador')
        .addUserOption(opt => opt
        .setName('alvo')
        .setDescription('Jogador a ser denunciado')
        .setRequired(true))
        .addStringOption(opt => opt
        .setName('motivo')
        .setDescription('Escolha o motivo da denúncia')
        .setRequired(true)
        .addChoices({ name: 'Discurso de ódio', value: 'discurso_de_odio' }, { name: 'Racismo', value: 'racismo' }, { name: 'Sexismo / Machismo', value: 'sexismo_machismo' }, { name: 'Comportamento antijogo', value: 'comportamento_antijogo' }, { name: 'Assédio', value: 'assedio' }, { name: 'Comportamento tóxico', value: 'comportamento_toxico' }, { name: 'Spam ou flood no chat de voz', value: 'spam_flood' })),
    async execute(interaction) {
        try {
            const client = interaction.client;
            const reporter = interaction.member;
            const target = interaction.options.getMember('alvo');
            const reason = interaction.options.getString('motivo', true);
            // Validações básicas
            if (!target) {
                await interaction.reply({
                    content: '❌ O jogador alvo não foi encontrado.',
                    flags: MessageFlags.Ephemeral,
                });
                return;
            }
            if (reporter.id === target.id) {
                await interaction.reply({
                    content: '❌ Você não pode se denunciar.',
                    flags: MessageFlags.Ephemeral,
                });
                return;
            }
            if (target.user.bot) {
                await interaction.reply({
                    content: '❌ Você não pode denunciar bots.',
                    flags: MessageFlags.Ephemeral,
                });
                return;
            }
            // Processa a denúncia usando o PunishmentManager
            const result = await PunishmentManager.handleReport(target, reporter, reason, client);
            // Responde ao usuário com o resultado
            await interaction.reply({
                content: result.success
                    ? `✅ Denúncia registrada contra **${target.displayName}**: ${result.message}`
                    : `❌ Falha ao registrar denúncia: ${result.message}`,
                flags: MessageFlags.Ephemeral,
            });
        }
        catch (error) {
            console.error(`[report] Erro ao processar denúncia:`, error);
            await interaction.reply({
                content: '❌ Ocorreu um erro ao processar sua denúncia. Tente novamente mais tarde.',
                flags: MessageFlags.Ephemeral,
            });
        }
    },
};
export default reportCommand;
