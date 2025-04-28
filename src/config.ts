import 'dotenv/config';
import { validateEnvVars } from './utils/utils.js';

// Interface para tipagem das configurações
interface AppConfig {
  DISCORD_TOKEN: string;
  RIOT_API_KEY: string;
  GUILD_ID: string;
  LOBBY_ID: string;
}

// Valida as variáveis de ambiente necessárias
validateEnvVars(['DISCORD_TOKEN', 'RIOT_API_KEY', 'GUILD_ID', 'LOBBY_ID']);

// Configurações exportadas
export const config: AppConfig = {
  DISCORD_TOKEN: process.env.DISCORD_TOKEN!,
  RIOT_API_KEY: process.env.RIOT_API_KEY!,
  GUILD_ID: process.env.GUILD_ID!,
  LOBBY_ID: process.env.LOBBY_ID!
};

export const ROLES = {
  DEFAULT: '1362465119539298507',
  INVOCADORES: '1365032596978798623'
};