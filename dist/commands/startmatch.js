"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const builders_1 = require("@discordjs/builders");
const discord_js_1 = require("discord.js");
const db_1 = require("../utils/db");
const startMatchCommand = {
    data: new builders_1.SlashCommandBuilder()
        .setName("startmatch")
        .setDescription("Inicia uma partida e configura a sala de espera")
        .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.Administrator),
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
// Funções auxiliares (mantidas do código anterior)
async function createVoiceChannel(guild, member) {
    return await guild.channels.create({
        name: `Partida do Time ${member.displayName}`,
        type: discord_js_1.ChannelType.GuildVoice,
        permissionOverwrites: [
            {
                id: guild.roles.everyone.id,
                deny: ['Connect'],
            },
            {
                id: member.id,
                allow: ['Connect', 'ViewChannel'],
            },
        ],
    });
}
async function getOrCreateVoiceChannel(guild, member) {
    const activeChannelId = db_1.db.data?.activeVoiceChannel;
    let voiceChannel;
    if (activeChannelId) {
        voiceChannel = guild.channels.cache.get(activeChannelId);
        if (!voiceChannel) {
            voiceChannel = await createVoiceChannel(guild, member);
            await updateActiveVoiceChannel(voiceChannel.id);
        }
    }
    else {
        voiceChannel = await createVoiceChannel(guild, member);
        await updateActiveVoiceChannel(voiceChannel.id);
    }
    return voiceChannel;
}
async function updateActiveVoiceChannel(channelId) {
    if (db_1.db.data) {
        db_1.db.data.activeVoiceChannel = channelId;
        await db_1.db.write();
    }
}
async function getOrCreateWaitingRoomChannel(guild) {
    const waitingRoomChannelId = db_1.db.data?.waitingRoomChannelId;
    let waitingRoomChannel;
    if (waitingRoomChannelId) {
        waitingRoomChannel = guild.channels.cache.get(waitingRoomChannelId);
        if (!waitingRoomChannel) {
            waitingRoomChannel = await createWaitingRoomChannel(guild);
            await updateWaitingRoomChannel(waitingRoomChannel.id);
        }
    }
    else {
        waitingRoomChannel = await createWaitingRoomChannel(guild);
        await updateWaitingRoomChannel(waitingRoomChannel.id);
    }
    return waitingRoomChannel;
}
async function createWaitingRoomChannel(guild) {
    return await guild.channels.create({
        name: "Sala de Espera",
        type: discord_js_1.ChannelType.GuildVoice,
        permissionOverwrites: [
            {
                id: guild.roles.everyone.id,
                allow: ['Connect', 'ViewChannel'],
            },
        ],
    });
}
async function updateWaitingRoomChannel(channelId) {
    if (db_1.db.data) {
        db_1.db.data.waitingRoomChannelId = channelId;
        await db_1.db.write();
    }
}
exports.default = startMatchCommand;
//# sourceMappingURL=startmatch.js.map