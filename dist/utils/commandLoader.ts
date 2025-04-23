import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import { Collection, Client, REST, Routes } from 'discord.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

interface ExtendedClient extends Client {
    commands: Collection<string, any>;
}

export async function loadCommands(client: ExtendedClient) {
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
        } catch (error) {
            console.error(`❌ Erro ao carregar ${file}:`, error);
        }
    }

    console.log(`📦 Total de comandos carregados: ${client.commands.size}`);
}