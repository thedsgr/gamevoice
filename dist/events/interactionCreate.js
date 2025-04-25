// Este arquivo contém a lógica para lidar com o evento "interactionCreate".
// Quando um usuário interage com o bot (por exemplo, executando um comando slash),
// o código verifica se o comando existe, aplica um sistema de cooldown para evitar spam
// e executa o comando correspondente. Caso ocorra algum erro, ele é registrado no log
// e uma mensagem de erro é enviada ao usuário.
import { isOnCooldown, setCooldown } from "../services/security.js";
import { Logger } from "../utils/log.js";
const cooldownTime = 5000;
export async function handleInteractionCreate(interaction) {
    if (!interaction.isCommand())
        return;
    const commandName = interaction.commandName;
    const client = interaction.client;
    // Verifica se o comando existe
    const command = client.commands.get(commandName);
    if (!command) {
        await interaction.reply({
            content: "❌ Comando não encontrado.",
            ephemeral: true,
        });
        Logger.warn(`Comando "${commandName}" não encontrado.`);
        return;
    }
    // Verifica cooldown
    const userId = interaction.user.id;
    const commandCooldown = cooldownTime; // Default cooldown time
    if (isOnCooldown(userId, commandCooldown)) {
        await interaction.reply({
            content: "⏳ Você está em cooldown. Tente novamente mais tarde.",
            ephemeral: true,
        });
        return;
    }
    // Executa o comando
    try {
        Logger.info(`Executando comando: ${commandName} por ${interaction.user.tag}`);
        await command.execute(interaction);
        // Define o cooldown
        setCooldown(userId, commandName, cooldownTime / 1000, cooldownTime);
    }
    catch (error) {
        Logger.error(`Erro ao executar o comando "${commandName}":`, error instanceof Error ? error : new Error(String(error)));
        await interaction.reply({
            content: "❌ Ocorreu um erro ao executar este comando.",
            ephemeral: true,
        });
    }
}
