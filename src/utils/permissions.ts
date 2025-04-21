import { ChatInputCommandInteraction, GuildMember, PermissionFlagsBits } from 'discord.js';

/**
 * Verifica se o usuário tem permissões administrativas.
 * @param interaction - A interação do comando.
 * @returns `true` se o usuário tiver permissões, caso contrário `false`.
 */
export function hasAdminPermissions(interaction: ChatInputCommandInteraction): boolean {
  const member = interaction.member;

  // Verifica se o membro é válido e possui permissões
  if (!member || !(member instanceof GuildMember)) {
    console.warn("⚠️ Não foi possível verificar as permissões: membro inválido.");
    return false;
  }

  return member.permissions.has(PermissionFlagsBits.Administrator);
}

/**
 * Responde à interação informando que o usuário não tem permissões.
 * @param interaction - A interação do comando.
 */
export async function replyNoPermission(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.reply({
    content: "❌ Você não tem permissão para usar este comando.",
    ephemeral: true,
  });
}
