import { SlashCommandBuilder } from '@discordjs/builders';
import { PunishmentManager } from '../services/punishment/core/punishmentManager.js';
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
        const client = interaction.client;
        const reporter = interaction.member;
        const target = interaction.options.getMember('alvo');
        const reason = interaction.options.getString('motivo', true);
        // Validações básicas
        if (!target) {
            await interaction.reply({
                content: '❌ O jogador alvo não foi encontrado.',
                ephemeral: true,
            });
            return;
        }
        if (reporter.id === target.id) {
            await interaction.reply({
                content: '❌ Você não pode se denunciar.',
                ephemeral: true,
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
            ephemeral: true,
        });
    },
};
export default reportCommand;
