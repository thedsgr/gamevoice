import { ChatInputCommandInteraction, PermissionsBitField, PermissionFlagsBits } from 'discord.js';
import { db } from '../utils/db.js'; // Certifique-se de que o banco de dados está importado corretamente

// src/services/security.ts

const cooldowns = new Map<string, number>();

/**
 * Verifica se o usuário está em cooldown.
 * @param userId - O ID do usuário.
 * @param seconds - O tempo de cooldown em segundos.
 * @returns `true` se o usuário ainda estiver em cooldown, caso contrário `false`.
 */
export function isOnCooldown(userId: string, seconds: number): boolean {
  const lastUsed = cooldowns.get(userId);
  if (!lastUsed) return false;

  const now = Date.now();
  return now - lastUsed < seconds * 1000;
}

/**
 * Define o cooldown para o usuário.
 * @param userId - O ID do usuário.
 */
export function setCooldown(userId: string) {
  cooldowns.set(userId, Date.now());
}

/**
 * Verifica se a interação é em um servidor.
 * @param interaction - A interação do comando.
 * @returns `true` se a interação for em um servidor, caso contrário responde ao usuário e retorna `false`.
 */
export function ensureInGuild(interaction: ChatInputCommandInteraction): boolean {
  if (!interaction.guild) {
    interaction.reply({
      content: "❌ Este comando só pode ser usado em um servidor.",
      ephemeral: true,
    });
    return false;
  }
  return true;
}

/**
 * Verifica se o usuário tem permissão de administrador.
 * @param interaction - A interação do comando.
 * @returns `true` se o usuário for administrador, caso contrário responde ao usuário e retorna `false`.
 */
export function ensureAdmin(interaction: ChatInputCommandInteraction): boolean {
  const member = interaction.member;
  if (!member || !('permissions' in member) || !(member.permissions instanceof PermissionsBitField) || !member.permissions.has(PermissionFlagsBits.Administrator)) {
    interaction.reply({
      content: "❌ Você não tem permissão para usar este comando.",
      ephemeral: true,
    });
    return false;
  }
  return true;
}

/**
 * Verifica se o usuário tem um Riot ID válido.
 * @param riotId - O Riot ID do usuário.
 * @returns `true` se o Riot ID for válido, caso contrário `false`.
 */
export function validateRiotId(riotId: string): boolean {
  const regex = /^[a-zA-Z0-9\u00C0-\u017F][a-zA-Z0-9\u00C0-\u017F ]{2,15}#[a-zA-Z0-9]{2,5}$/;
  if (!regex.test(riotId)) return false;

  const [name, tag] = riotId.split('#');
  return name.length >= 3 && tag.length >= 2;
}

/**
 * Verifica se o usuário tem um Riot ID vinculado.
 * @param discordId - O ID do usuário no Discord.
 * @param db - O banco de dados.
 * @returns `true` se o usuário tiver um Riot ID vinculado, caso contrário `false`.
 */
export function hasLinkedRiotId(discordId: string, db: any): boolean {
  const user = db.data?.users.find((u: any) => u.discordId === discordId);
  return !!user?.riotId;
}

/**
 * Verifica se o usuário pode realizar uma denúncia.
 * @param userId - O ID do usuário que está denunciando.
 * @param targetId - O ID do usuário alvo da denúncia.
 * @returns `true` se o usuário puder realizar a denúncia, caso contrário `false`.
 */
export function canReport(userId: string, targetId: string): boolean {
  const lastHour = Date.now() - 3600000; // Última hora em milissegundos
  const recentReports = db.data?.reports.filter(r => 
    r.reporterId === userId && 
    r.timestamp > lastHour
  ) || [];
  
  return recentReports.length < 5; // Máximo de 5 denúncias por hora
}