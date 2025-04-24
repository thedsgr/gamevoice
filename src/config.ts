import 'dotenv/config';

// Interface para tipagem das configurações
interface AppConfig {
  DISCORD_TOKEN: string;
  RIOT_API_KEY: string;
  GUILD_ID: string;
  WAITING_ROOM_ID: string;
}

// Validação das variáveis de ambiente
function validateEnv(config: Partial<AppConfig>): AppConfig {
  const missingVars = Object.entries(config)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missingVars.length > 0) {
    throw new Error(
      `As seguintes variáveis estão faltando no .env: ${missingVars.join(', ')}`
    );
  }

  return config as AppConfig;
}

// Configurações exportadas
export const config: AppConfig = validateEnv({
  DISCORD_TOKEN: process.env.DISCORD_TOKEN,
  RIOT_API_KEY: process.env.RIOT_API_KEY,
  GUILD_ID: process.env.GUILD_ID,
  WAITING_ROOM_ID: process.env.WAITING_ROOM_ID
});

console.log('Configurações carregadas com sucesso!');
console.log('RIOT_API_KEY:', process.env.RIOT_API_KEY);