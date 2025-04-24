import 'dotenv/config';
// Validação das variáveis de ambiente
function validateEnv(config) {
    const missingVars = Object.entries(config)
        .filter(([_, value]) => !value)
        .map(([key]) => key);
    if (missingVars.length > 0) {
        throw new Error(`As seguintes variáveis estão faltando no .env: ${missingVars.join(', ')}`);
    }
    return config;
}
// Configurações exportadas
export const config = validateEnv({
    DISCORD_TOKEN: process.env.DISCORD_TOKEN,
    RIOT_API_KEY: process.env.RIOT_API_KEY,
    GUILD_ID: process.env.GUILD_ID,
    WAITING_ROOM_ID: process.env.WAITING_ROOM_ID
});
console.log('Configurações carregadas com sucesso!');
console.log('RIOT_API_KEY:', process.env.RIOT_API_KEY);
