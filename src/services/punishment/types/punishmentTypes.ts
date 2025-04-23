import { GuildMember, Client } from 'discord.js';

export interface PunishmentResult {
  success: boolean;
  message: string;
  duration?: number;
  nextStage?: number; // Adicionado para progressão de punições
}

export interface PunishmentConfig {
  threshold: number;
  action: PunishmentAction;
  notifyUser: boolean; // Se deve enviar DM ao usuário
}

export type PunishmentAction = (
  target: GuildMember,
  reason?: string,
  client?: Client
) => Promise<PunishmentResult>;

export type PunishmentActionType = 
  | 'VOICE_MUTE'
  | 'VOICE_UNMUTE'
  | 'COMMAND_RESTRICT'
  | 'COMMAND_UNRESTRICT'
  | 'BAN'
  | 'KICK'
  | 'WARNING';