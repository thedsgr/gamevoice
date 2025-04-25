// Este arquivo implementa o evento `guildMemberAdd`, que é acionado quando um novo membro
// entra no servidor. Ele envia uma mensagem de boas-vindas no canal designado com ID: 1365032024712286353.
export default async function handleGuildMemberAdd(member) {
    const welcomeChannelId = '1365032024712286353'; // ID do canal de boas-vindas
    try {
        // Busca o canal de boas-vindas pelo ID
        const welcomeChannel = member.guild.channels.cache.get(welcomeChannelId);
        if (!welcomeChannel) {
            console.error(`Canal de boas-vindas com ID "${welcomeChannelId}" não encontrado.`);
            return;
        }
        // Envia mensagem de boas-vindas
        await welcomeChannel.send(`🎉 Bem-vindo(a), ${member.user}! Certifique-se de ler as regras e se preparar para as partidas.`);
    }
    catch (error) {
        console.error('Erro ao processar o evento guildMemberAdd:', error);
    }
}
