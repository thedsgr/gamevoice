import { SlashCommandBuilder } from '@discordjs/builders';
import type { ChatInputCommandInteraction } from 'discord.js';
import { db, Report as DBReport } from '../utils/db.js'; // Renomeado para evitar conflito
import { SlashCommand } from '../structs/types/SlashCommand.js';

const REPORT_THRESHOLD = 20;

const reportCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('report')
    .setDescription('Denunciar comportamento agressivo de um jogador')
    .addUserOption(opt =>
      opt
        .setName('alvo')
        .setDescription('Jogador a ser denunciado')
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt
        .setName('motivo')
        .setDescription('Descreva o motivo da denúncia')
        .setRequired(true)
    ) as SlashCommandBuilder,

  async execute(interaction: ChatInputCommandInteraction) {
    const reporterId = interaction.user.id;
    const target = interaction.options.getUser('alvo', true);
    const reason = interaction.options.getString('motivo', true);

    db.data!.reports ||= [];
    const newReport: DBReport = {
      targetId: target.id,
      reporterId,
      reason,
      timestamp: Date.now(),
    };
    db.data!.reports.push(newReport);
    await db.write();

    const count = db.data!.reports.filter(r => r.targetId === target.id).length;
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
