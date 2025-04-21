// src/utils/commandLoader.ts
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
// Recria o comportamento de __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
/**
 * Carrega todos os comandos do diretório especificado e os registra no cliente.
 * @param client - A instância do cliente estendido.
 */
export async function loadCommands(client) {
    const commandsPath = path.join(__dirname, '../commands');
    const extension = process.env.NODE_ENV === 'production' ? '.js' : '.ts';
    // Filtra os arquivos de comando com a extensão correta
    const commandFiles = fs
        .readdirSync(commandsPath)
        .filter(file => file.endsWith(extension) && file !== `SlashCommand${extension}`);
    for (const file of commandFiles) {
        const filePath = path.resolve(commandsPath, file);
        try {
            const { default: command } = await import(filePath);
            if (command && command.data && command.execute) {
                client.commands.set(command.data.name, command);
                console.log(`✅ Comando carregado: ${command.data.name}`);
            }
            else {
                console.warn(`⚠️ Arquivo ${file} não é um comando válido.`);
            }
        }
        catch (error) {
            console.error(`❌ Falha ao importar o comando ${file}:`, error);
        }
    }
    console.log(`📦 Total de comandos carregados: ${client.commands.size}`);
}
//# sourceMappingURL=commandLoader.js.map