import dotenv from 'dotenv';
dotenv.config();
export const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
export const RIOT_API_KEY = process.env.RIOT_API_KEY;
export const GUILD_ID = process.env.GUILD_ID;
export const WAITING_ROOM_ID = process.env.WAITING_ROOM_ID;
if (!DISCORD_TOKEN)
    throw new Error('DISCORD_TOKEN não está definido no arquivo .env');
if (!RIOT_API_KEY)
    throw new Error('RIOT_API_KEY não está definido no arquivo .env');
if (!GUILD_ID)
    throw new Error('GUILD_ID não está definido no arquivo .env');
if (!WAITING_ROOM_ID)
    throw new Error('WAITING_ROOM_ID não está definido no arquivo .env');
