import { SlashCommandBuilder } from '@discordjs/builders';
import { PermissionFlagsBits, } from 'discord.js';
import { getOrCreateVoiceChannel, getOrCreateWaitingRoomChannel, } from '../../services/voice.js';
const startMatchCommand = {
    data: new SlashCommandBuilder()
        .setName("startmatch")
        .setDescription("Inicia uma partida e configura a sala de espera")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        const guild = interaction.guild;
        if (!guild) {
            await interaction.reply({
                content: "❌ Este comando só pode ser usado em um servidor.",
                ephemeral: true,
            });
            return;
        }
        try {
            await interaction.deferReply({ ephemeral: true });
            const me = guild.members.me;
            if (!me || !me.permissions.has(['ManageChannels', 'MoveMembers'])) {
                await interaction.editReply({
                    content: "❌ Não tenho permissões suficientes para criar canais ou mover usuários.",
                });
                return;
            }
            // Cria ou reutiliza o canal de voz da partida
            const voiceChannel = await getOrCreateVoiceChannel(guild, interaction.member);
            // Cria ou verifica a sala de espera
            const waitingRoomChannel = await getOrCreateWaitingRoomChannel(guild);
            // 🆕 Move quem já está na sala de espera
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
                    if (err.code === 50007) { // Código de erro para "Cannot send messages to this user"
                        console.warn(`⚠️ Não foi possível enviar uma DM para ${member.user.tag}.`);
                    }
                }
            }
            await interaction.editReply({
                content: `🟢 Partida iniciada! Canal de voz: **${voiceChannel.name}**. Sala de espera: **${waitingRoomChannel.name}**`,
            });
        }
        catch (error) {
            console.error("❌ Erro ao executar o comando startmatch:", error);
            await interaction.editReply({
                content: "❌ Ocorreu um erro ao iniciar a partida.",
            });
        }
    },
};
export default startMatchCommand;
//# sourceMappingURL=startmatch.js.map