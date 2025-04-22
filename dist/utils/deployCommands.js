import { REST, Routes } from 'discord.js';
import 'dotenv/config';
const commands = [
    {
        name: 'startmatch',
        description: 'Inicia uma nova partida.',
    },
    // Adicione outros comandos aqui, se necessário
];
const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN);
(async () => {
    try {
        console.log('🔄 Registrando comandos...');
        await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID), { body: commands });
        console.log('✅ Comandos registrados com sucesso!');
    }
    catch (error) {
        console.error('❌ Erro ao registrar comandos:', error);
    }
})();
//# sourceMappingURL=deployCommands.js.map