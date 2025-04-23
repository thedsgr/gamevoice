import { SlashCommandBuilder, ChannelType } from 'discord.js';
import { ensureInGuild, ensureAdmin } from '../services/security.js';
import { MatchManager } from '../services/matchManagement.js';
export default {
    data: new SlashCommandBuilder()
        .setName('startmatch')
        .setDescription('Inicia uma nova partida com canais dinâmicos para times'),
    async execute(interaction) {
        await interaction.deferReply({ flags: 64 }); // 64 é o valor para mensagens efêmeras
        try {
            ensureInGuild(interaction);
            ensureAdmin(interaction);
            const guild = interaction.guild;
            // Verifica permissões do bot
            const botMember = await guild.members.fetchMe();
            if (!botMember.permissions.has('MoveMembers') || !botMember.permissions.has('ManageChannels')) {
                await interaction.editReply('❌ O bot precisa das permissões "Mover Membros" e "Gerenciar Canais"');
                return;
            }
            const waitingRoom = await getWaitingRoom(guild);
            if (waitingRoom.members.size === 0) {
                await interaction.editReply('⚠️ Não há jogadores na sala de espera!');
                return;
            }
            const players = Array.from(waitingRoom.members.values());
            const matchId = await MatchManager.startMatch(guild, players);
            await interaction.editReply({
                content: `✅ **Partida Iniciada** (ID: ${matchId})`,
                embeds: [{
                        color: 0x00ff00,
                        fields: [
                            { name: 'Jogadores', value: `${players.length} participantes`, inline: true },
                            { name: 'Status', value: 'Canais criados e times formados', inline: true }
                        ],
                        timestamp: new Date().toISOString()
                    }]
            });
        }
        catch (error) {
            console.error('Erro no comando /startmatch:', error);
            let errorMessage = '❌ Ocorreu um erro ao iniciar a partida';
            if (error instanceof Error) {
                errorMessage += `: ${error.message}`;
            }
            await interaction.editReply(errorMessage).catch(console.error);
        }
    }
};
async function getWaitingRoom(guild) {
    let waitingRoom = guild.channels.cache.find(c => c.type === ChannelType.GuildVoice &&
        (c.name.toLowerCase() === 'sala de espera' || c.name.toLowerCase() === 'waiting room'));
    if (!waitingRoom) {
        waitingRoom = await guild.channels.create({
            name: 'Sala de Espera',
            type: ChannelType.GuildVoice,
            reason: 'Criado automaticamente para o comando /startmatch'
        });
    }
    return waitingRoom;
}
