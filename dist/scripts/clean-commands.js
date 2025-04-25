import { REST, Routes } from 'discord.js';
import * as dotenv from 'dotenv';
dotenv.config();
const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
(async () => {
    try {
        console.log('🗑️ Limpando TODOS os comandos...');
        // Limpa comandos globais
        await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: [] });
        // Limpa comandos do servidor específico
        await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID), { body: [] });
        console.log('✅ Todos os comandos foram removidos com sucesso!');
    }
    catch (error) {
        console.error('❌ Erro ao limpar comandos:', error);
    }
})();
