// src/events/interactionCreate.ts
import { MessageFlags, Client, Collection, GatewayIntentBits, } from "discord.js";
const cooldownTime = 10; // Tempo de cooldown em segundos
export default async function interactionCreate(interaction, client) {
    if (!interaction.isChatInputCommand())
        return;
    const command = client.commands.get(interaction.commandName);
    if (!command)
        return;
    try {
        // Passo 6: Executar comando sem tratamento duplo
        await command.execute(interaction);
    }
    catch (error) {
        console.error(`❌ Erro no comando ${interaction.commandName}:`, error);
        // Passo 7: Tratamento seguro de erros pós-resposta
        if (interaction.deferred && !interaction.replied) {
            await interaction.editReply('⚠️ Ocorreu um erro durante a execução.');
        }
        else if (!interaction.replied) {
            await interaction.reply({
                content: '⚠️ Erro ao processar comando.',
                ephemeral: true,
                flags: MessageFlags.Ephemeral // Usando flags
            });
        }
    }
}
class LocalExtendedClient extends Client {
    constructor() {
        super({ intents: [GatewayIntentBits.Guilds] });
        this.commands = new Collection();
    }
}
