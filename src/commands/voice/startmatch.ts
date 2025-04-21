import { SlashCommandBuilder } from '@discordjs/builders';
import {
  ChatInputCommandInteraction,
  GuildMember,
} from 'discord.js';
import { SlashCommand } from '../../structs/types/SlashCommand.js';
import {
  getOrCreateVoiceChannel,
  getOrCreateWaitingRoomChannel,
} from '../../services/voice.js';
import { ensureInGuild, ensureAdmin } from '../../services/security.js';
import { createBackup } from '../../utils/backup.js';
import { db } from "../../utils/db.js";

const startMatchCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("startmatch")
    .setDescription("Inicia uma partida e configura a sala de espera"),

  async execute(interaction: ChatInputCommandInteraction) {
    // Verifica se a interação é em um servidor
    if (!ensureInGuild(interaction)) return;

    // Verifica se o usuário tem permissão de administrador
    if (!ensureAdmin(interaction)) return;

    try {
      await interaction.deferReply({ ephemeral: true });

      const guild = interaction.guild!;
      const me = guild.members.me;

      // Verifica se o bot tem permissões necessárias
      if (!me || !me.permissions.has(['ManageChannels', 'MoveMembers'])) {
        await interaction.editReply({
          content: "❌ Não tenho permissões suficientes para criar canais ou mover usuários.",
        });
        return;
      }

      // Cria ou reutiliza o canal de voz da partida
      const voiceChannel = await getOrCreateVoiceChannel(guild, interaction.member as GuildMember);

      // Cria ou verifica a sala de espera
      const waitingRoomChannel = await getOrCreateWaitingRoomChannel(guild);

      // Move membros da sala de espera para o canal de voz
      await moveMembersToChannel(waitingRoomChannel, voiceChannel);

      // Salva alterações no banco de dados
      await db.write();

      // Cria um backup do banco de dados
      await createBackup();

      await interaction.editReply({
        content: `🟢 Partida iniciada! Canal de voz: **${voiceChannel.name}**. Sala de espera: **${waitingRoomChannel.name}**`,
      });
    } catch (error) {
      console.error("❌ Erro ao executar o comando startmatch:", error);
      await interaction.editReply({
        content: "❌ Ocorreu um erro ao iniciar a partida.",
      });
    }
  },
};

export default startMatchCommand;

/**
 * Move todos os membros de um canal de espera para o canal de voz.
 * @param waitingRoomChannel - O canal de espera.
 * @param voiceChannel - O canal de voz.
 */
async function moveMembersToChannel(waitingRoomChannel: any, voiceChannel: any) {
  for (const [_, member] of waitingRoomChannel.members) {
    try {
      await member.voice.setChannel(voiceChannel);
      console.log(`✅ ${member.user.tag} foi movido para ${voiceChannel.name}`);

      // Envia uma mensagem privada (DM) para o usuário
      await member.send(`✅ Você foi movido para a call **${voiceChannel.name}**. Boa partida!`);
    } catch (err) {
      console.error(`❌ Erro ao mover ${member.user.tag}:`, err);

      // Caso o envio da DM falhe
      if ((err as any).code === 50007) { // Código de erro para "Cannot send messages to this user"
        console.warn(`⚠️ Não foi possível enviar uma DM para ${member.user.tag}.`);
      }
    }
  }
}