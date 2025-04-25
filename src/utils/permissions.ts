/**
 * Este arquivo contém funções utilitárias para verificar permissões de usuários no Discord.
 * Ele é usado para garantir que apenas usuários com permissões administrativas possam
 * executar determinados comandos e para responder adequadamente quando um usuário não
 * possui as permissões necessárias.
 * 
 * Funcionalidades principais:
 * - Verificar se um usuário tem permissões administrativas.
 * - Responder à interação informando que o usuário não tem permissões.
 */

import { ChatInputCommandInteraction, GuildMember, PermissionFlagsBits } from 'discord.js';
import { Logger } from './log.js';

/**
 * Verifica se o usuário tem uma permissão específica.
 * @param interaction - A interação do comando.
 * @param permission - A permissão a ser verificada.
 * @returns `true` se o usuário tiver a permissão, caso contrário `false`.
 */
export function hasPermission(
    interaction: ChatInputCommandInteraction,
    permission: bigint
): boolean {
    const member = interaction.member;

    if (!member || !(member instanceof GuildMember)) {
        Logger.warn("⚠️ Não foi possível verificar as permissões: membro inválido.");
        return false;
    }

    return member.permissions.has(permission);
}

/**
 * Verifica se o usuário tem permissões administrativas.
 * @param interaction - A interação do comando.
 * @returns `true` se o usuário tiver permissões administrativas, caso contrário `false`.
 */
export function hasAdminPermissions(interaction: ChatInputCommandInteraction): boolean {
    return hasPermission(interaction, PermissionFlagsBits.Administrator);
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
