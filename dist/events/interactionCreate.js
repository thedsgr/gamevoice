// src/events/interactionCreate.ts
import { Client, Collection, GatewayIntentBits, } from "discord.js";
import { handleButtonInteraction } from '../commands/admin/painel.js';
const cooldownTime = 10; // Tempo de cooldown em segundos
export default async function interactionCreate(interaction, client) {
    try {
        if (interaction.isChatInputCommand()) {
            console.log(`🔄 Comando recebido: ${interaction.commandName}`);
            await handleSlashCommand(interaction, client);
        }
        else if (interaction.isButton()) {
            console.log(`🔘 Botão pressionado: ${interaction.customId}`);
            await handleButtonInteraction(interaction);
        }
        else if (interaction.isCommand() && interaction.commandName === 'startmatch') {
            await interaction.reply({
                content: 'Esta mensagem é apenas para você.',
                ephemeral: true, // Corrigido
            });
        }
    }
    catch (error) {
        console.error("❌ Erro no evento interactionCreate:", error);
    }
}
async function handleSlashCommand(interaction, client) {
    const command = client.commands.get(interaction.commandName);
    if (!command) {
        console.warn(`⚠️ Comando ${interaction.commandName} não encontrado.`);
        await interaction.reply({
            content: '⚠️ Comando não encontrado.',
            ephemeral: true,
        });
        return;
    }
    try {
        await command.execute(interaction);
    }
    catch (error) {
        console.error(`❌ Erro ao executar o comando ${interaction.commandName}:`, error);
        await interaction.reply({
            content: '❌ Ocorreu um erro ao executar o comando.',
            ephemeral: true,
        });
    }
}
class LocalExtendedClient extends Client {
    commands;
    constructor() {
        super({ intents: [GatewayIntentBits.Guilds] });
        this.commands = new Collection();
    }
}
//# sourceMappingURL=interactionCreate.js.map