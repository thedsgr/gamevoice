import { ChannelType } from 'discord.js';
export async function createSingleRoom(guild, players, matchId) {
    const category = await getOrCreateCategory(guild);
    const channelName = `Time-${matchId.slice(0, 6)}`;
    const channel = await getOrCreateChannel(guild, category, channelName);
    console.log(`[DISCORD] Criando sala: ${channel.name}`);
    await movePlayersToChannel(players, channel);
}
async function getOrCreateCategory(guild) {
    const existing = guild.channels.cache.find((c) => c.type === ChannelType.GuildCategory && c.name === 'PARTIDAS');
    return (existing ||
        (await guild.channels.create({
            name: 'PARTIDAS',
            type: ChannelType.GuildCategory,
            reason: 'Categoria para partidas automáticas',
        })));
}
async function getOrCreateChannel(guild, category, name) {
    const existing = guild.channels.cache.find((c) => c.type === ChannelType.GuildVoice && c.name === name);
    return (existing ||
        (await guild.channels.create({
            name,
            type: ChannelType.GuildVoice,
            parent: category,
            reason: `Canal criado para a partida ${name}`,
        })));
}
async function movePlayersToChannel(players, channel) {
    await Promise.all(players.map(player => player.voice.setChannel(channel).catch(err => console.error(`Erro ao mover o jogador ${player.displayName} para o canal ${channel.name}:`, err))));
}
export async function createTwoRooms(guild, players, matchId) {
    const category = await getOrCreateCategory(guild);
    const half = Math.ceil(players.length / 2);
    const team1 = players.slice(0, half);
    const team2 = players.slice(half);
    const team1Channel = await getOrCreateChannel(guild, category, `Time1-${matchId.slice(0, 6)}`);
    const team2Channel = await getOrCreateChannel(guild, category, `Time2-${matchId.slice(0, 6)}`);
    console.log(`[DISCORD] Criando duas salas: ${team1Channel.name} e ${team2Channel.name}`);
    await Promise.all([
        movePlayersToChannel(team1, team1Channel),
        movePlayersToChannel(team2, team2Channel),
    ]);
}
export async function movePlayersToTeamRooms(guild, waitingRoom, teamData) {
    // Mapeia os jogadores da sala de espera
    const waitingPlayers = Array.from(waitingRoom.members.values());
    // Encontra os membros do Discord correspondentes
    const teamMembers = teamData.teamPlayers
        .map(player => {
        const member = waitingPlayers.find(m => m.displayName.includes(player.riotName) ||
            m.id === player.discordId);
        return member ? { ...player, member } : null;
    })
        .filter(Boolean);
    if (teamMembers.length === 0) {
        console.log('Nenhum jogador do time encontrado na sala de espera');
        return;
    }
    // Decide quantas salas criar
    if (teamMembers.length <= 5) {
        await createSingleRoom(guild, teamMembers.filter(t => t !== null).map(t => t.member), teamData.matchId);
    }
    else {
        await createTwoRooms(guild, teamMembers.filter(t => t !== null).map(t => t.member), teamData.matchId);
    }
}
