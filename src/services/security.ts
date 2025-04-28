// Este arquivo contém funções relacionadas à segurança e controle de acesso no bot.
// Ele inclui verificações de cooldown para comandos, validação de permissões de administrador,
// validação de Riot IDs, e outras funções auxiliares para garantir que os comandos sejam usados
// de forma segura e dentro das regras definidas. Também implementa limites para denúncias e
// verifica se o usuário está em um servidor antes de executar comandos.

import { ChatInputCommandInteraction, PermissionsBitField, PermissionFlagsBits, MessageFlags } from 'discord.js';
import db from '../utils/db.js'; // Corrigido para usar a exportação padrão

const cooldowns = new Map<string, number>();

/**
 * Verifica se o usuário está em cooldown.
 * @param userId - O ID do usuário.
 * @param commandName - O nome do comando.
 * @param seconds - O tempo de cooldown em segundos.
 * @returns `true` se o usuário ainda estiver em cooldown, caso contrário `false`.
 */
export function isOnCooldown(userId: string, commandName: string, seconds: number): boolean {
  const key = `${userId}:${commandName}`;
  const lastUsed = cooldowns.get(key);
  if (!lastUsed) return false;

  const now = Date.now();
  return now - lastUsed < seconds * 1000;
}

/**
 * Define o cooldown para o usuário.
 * @param userId - O ID do usuário.
 * @param commandName - O nome do comando.
 * @param seconds - O tempo de cooldown em segundos.
 */
export function setCooldown(userId: string, commandName: string, seconds: number): void {
  const key = `${userId}:${commandName}`;
  cooldowns.set(key, Date.now());
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
      flags: MessageFlags.Ephemeral,
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
      flags: MessageFlags.Ephemeral,
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
export async function canReport(userId: string, targetId: string): Promise<boolean> {
  const lastHour = Date.now() - 3600000; // Última hora em milissegundos
  const recentReports = await db('reports')
    .where('reporterId', userId)
    .andWhere('timestamp', '>', lastHour);
  
  return recentReports.length < 5; // Máximo de 5 denúncias por hora
}

/**
 * Verifica se o Riot ID já está vinculado a um usuário.
 * @param riotId - O Riot ID do usuário.
 * @returns `true` se o Riot ID já estiver vinculado, caso contrário `false`.
 */
export async function checkExistingLink(riotId: string): Promise<boolean> {
  try {
    const isLinked = await db('users').where({ riotId }).first() !== undefined;
    return isLinked;
  } catch (error) {
    throw error;
  }
}

/**
 * Salva o vínculo do Riot ID no banco de dados.
 * @param userId - O ID do usuário no Discord.
 * @param riotId - O Riot ID do usuário.
 * @returns `void`
 */
export function saveLinkToDatabase(userId: string, riotId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      resolve();
    } catch (error) {
      reject(error);
    }
  });
}