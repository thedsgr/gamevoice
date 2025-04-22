import { SlashCommandBuilder } from 'discord.js';
import { getOrCreateVoiceChannel, getOrCreateWaitingRoomChannel, } from '../services/voice.js';
import { ensureInGuild, ensureAdmin } from '../services/security.js';
const startMatchCommand = {
    data: new SlashCommandBuilder()
        .setName('startmatch')
        .setDescription('Inicia uma nova partida.'),
    async execute(interaction) {
        try {
            // Defer a resposta para evitar timeout
            await interaction.deferReply({ ephemeral: true });
            // Garante que o usuário está em um servidor e é administrador
            ensureInGuild(interaction);
            ensureAdmin(interaction);
            // Cria ou obtém os canais necessários
            const waitingRoomChannel = await getOrCreateWaitingRoomChannel(interaction.guild);
            const voiceChannel = await getOrCreateVoiceChannel(interaction.guild, interaction.member);
            console.log(`🔄 Iniciando a partida no servidor ${interaction.guild?.name}`);
            console.log(`📂 Canal de espera: ${waitingRoomChannel.name}`);
            console.log(`📂 Canal de voz: ${voiceChannel.name}`);
            // Move os membros do canal de espera para o canal de voz
            await moveMembersToChannel(waitingRoomChannel, voiceChannel);
            // Envia uma mensagem de sucesso
            await interaction.editReply(`✅ Partida iniciada com sucesso! Os membros foram movidos para o canal **${voiceChannel.name}**.`);
        }
        catch (error) {
            console.error('❌ Erro ao executar o comando startmatch:', error);
            await interaction.editReply('❌ Ocorreu um erro ao iniciar a partida.');
        }
    },
};
export default startMatchCommand;
/**
 * Move todos os membros de um canal de espera para o canal de voz.
 * @param waitingRoomChannel - O canal de espera.
 * @param voiceChannel - O canal de voz.
 */
async function moveMembersToChannel(waitingRoomChannel, voiceChannel) {
    for (const [_, member] of waitingRoomChannel.members) {
        try {
            await member.voice.setChannel(voiceChannel);
            console.log(`✅ ${member.user.tag} foi movido para ${voiceChannel.name}`);
            // Envia uma mensagem privada (DM) para o usuário
            await member.send(`✅ Você foi movido para a call **${voiceChannel.name}**. Boa partida!`);
        }
        catch (err) {
            console.error(`❌ Erro ao mover ${member.user.tag}:`, err);
            // Caso o envio da DM falhe
            if (err.code === 50007) {
                console.warn(`⚠️ Não foi possível enviar uma DM para ${member.user.tag}.`);
            }
        }
    }
}
//# sourceMappingURL=startmatch.js.map