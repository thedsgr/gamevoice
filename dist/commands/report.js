import { SlashCommandBuilder } from '@discordjs/builders';
import { db } from '../utils/db'; // Renomeado para evitar conflito
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
        .setDescription('Descreva o motivo da denúncia')
        .setRequired(true)),
    async execute(interaction) {
        const reporterId = interaction.user.id;
        const target = interaction.options.getUser('alvo', true);
        const reason = interaction.options.getString('motivo', true);
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
        if (count >= REPORT_THRESHOLD && interaction.guild) {
            const member = await interaction.guild.members.fetch(target.id).catch(() => null);
            if (member) {
                await member.kick(`Excedeu ${count} denúncias por toxicidade`);
                await interaction.followUp({
                    content: `⚠️ **${target.tag}** removido por atingir ${count} denúncias.`,
                    ephemeral: false,
                });
            }
        }
    },
};
export default reportCommand;
//# sourceMappingURL=report.js.map