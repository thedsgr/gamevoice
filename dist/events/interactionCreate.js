import { Events, MessageFlags } from 'discord.js';
import { Logger } from '../utils/log.js';
import { isOnCooldown, setCooldown } from '../services/security.js';
import { Messages } from '../utils/messageUtils.js';
const commandCooldown = 5; // Cooldown de 5 segundos
export function handleInteractionCreate(interaction, client) {
    client.on(Events.InteractionCreate, async (interaction) => {
        if (!interaction.isChatInputCommand())
            return;
        const command = client.commands?.get(interaction.commandName);
        if (!command) {
            Logger.warn(`Comando "${interaction.commandName}" não encontrado.`);
            try {
                await interaction.reply({
                    content: Messages.commandNotFound,
                    flags: MessageFlags.Ephemeral,
                });
            }
            catch (error) {
                Logger.error('Erro ao responder comando não encontrado:', error instanceof Error ? error : new Error(String(error)));
            }
            return;
        }
        // Verifica cooldown
        const userId = interaction.user.id;
        if (isOnCooldown(userId, interaction.commandName, commandCooldown)) {
            try {
                await interaction.reply({
                    content: Messages.cooldownActive,
                    flags: MessageFlags.Ephemeral,
                });
            }
            catch (error) {
                Logger.error('Falha ao enviar mensagem de cooldown:', error instanceof Error ? error : new Error(String(error)));
            }
            return;
        }
        try {
            Logger.info(`Executando comando: ${interaction.commandName}`);
            await command.execute(interaction);
            // Define o cooldown somente após a execução bem-sucedida
            setCooldown(userId, interaction.commandName, commandCooldown);
        }
        catch (error) {
            Logger.error(`Erro ao executar o comando "${interaction.commandName}":`, error instanceof Error ? error : new Error(String(error)));
            try {
                if (interaction.deferred || interaction.replied) {
                    await interaction.editReply({
                        content: Messages.commandError,
                    });
                }
                else {
                    await interaction.reply({
                        content: Messages.commandError,
                        flags: MessageFlags.Ephemeral,
                    });
                }
            }
            catch (replyError) {
                Logger.error('Falha ao enviar mensagem de erro:', replyError instanceof Error ? replyError : new Error(String(replyError)));
            }
        }
    });
}
;
