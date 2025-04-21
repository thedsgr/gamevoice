import { SlashCommandBuilder } from '@discordjs/builders';
import { db } from '../../utils/db.js'; // Renomeado para evitar conflito
import { isOnCooldown, setCooldown } from '../../services/security.js';
import { sendLog } from '../../utils/log.js';
const REPORT_THRESHOLD = 20;
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
        const reporterId = interaction.user.id;
        const target = interaction.options.getUser('alvo', true);
        const reason = interaction.options.getString('motivo', true);
        // Impede que o usuário reporte a si mesmo
        if (reporterId === target.id) {
            await interaction.reply({
                content: "❌ Você não pode se denunciar.",
                ephemeral: true,
            });
            return;
        }
        // Verifica se o usuário está em cooldown
        if (isOnCooldown(reporterId, 60)) {
            await interaction.reply({
                content: "⏳ Aguarde antes de enviar outra denúncia.",
                ephemeral: true,
            });
            return;
        }
        setCooldown(reporterId);
        // Registra a denúncia
        db.data.reports ||= [];
        const newReport = {
            targetId: target.id,
            reporterId,
            reason,
            timestamp: Date.now(),
        };
        db.data.reports.push(newReport);
        await db.write();
        const count = db.data.reports.filter(r => r.targetId === target.id).length;
        await interaction.reply({
            content: `🚩 Denúncia registrada contra **${target.tag}**. Total: **${count}**.`,
            ephemeral: true,
        });
        // Log de denúncia registrada
        await sendLog(interaction.client, `📝 [LOG] ${interaction.user.tag} denunciou ${target.tag} por ${reason}.`, 'LOG');
        // Verifica se o número de denúncias excede o limite
        if (count >= REPORT_THRESHOLD && interaction.guild) {
            const member = await interaction.guild.members.fetch(target.id).catch(() => null);
            if (member) {
                await member.kick(`Excedeu ${count} denúncias por toxicidade`);
                await interaction.followUp({
                    content: `⚠️ **${target.tag}** removido por atingir ${count} denúncias.`,
                    ephemeral: false,
                });
                // Log de expulsão por denúncias
                await sendLog(interaction.client, `⚠️ [MOD] ${target.tag} foi expulso por atingir ${count} denúncias.`, 'MOD');
            }
        }
    },
};
export default reportCommand;
//# sourceMappingURL=report.js.map