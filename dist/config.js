import 'dotenv/config';
import { validateEnvVars } from './utils/utils.js';
// Valida as variáveis de ambiente necessárias
validateEnvVars(['DISCORD_TOKEN', 'RIOT_API_KEY', 'GUILD_ID', 'LOBBY_ID']);
// Configurações exportadas
export const config = {
    DISCORD_TOKEN: process.env.DISCORD_TOKEN,
    RIOT_API_KEY: process.env.RIOT_API_KEY,
    GUILD_ID: process.env.GUILD_ID,
    LOBBY_ID: process.env.LOBBY_ID
};
export const ROLES = {
    DEFAULT: '1362465119539298507',
    INVOCADORES: '1365032596978798623'
};
