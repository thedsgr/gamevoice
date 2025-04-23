import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import { Collection } from 'discord.js';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
export async function loadCommands(client) {
    client.commands = new Collection();
    const commandsPath = path.join(__dirname, '../commands');
    // Carrega apenas arquivos .js (compilados)
    const commandFiles = fs.readdirSync(commandsPath)
        .filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        try {
            // Importa usando caminho relativo
            const command = (await import(`../commands/${file}`)).default;
            if (!command?.data?.name || !command?.execute) {
                console.warn(`⚠️ O comando em ${file} está incompleto ou inválido.`);
                continue;
            }
            client.commands.set(command.data.name, command);
            console.log(`✅ Comando carregado: ${command.data.name}`);
        }
        catch (error) {
            console.error(`❌ Erro ao carregar ${file}:`, error);
        }
    }
    console.log(`📦 Total de comandos carregados: ${client.commands.size}`);
}
