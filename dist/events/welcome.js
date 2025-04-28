// Este arquivo implementa o evento `guildMemberAdd`, que é acionado quando um novo membro
// entra no servidor. Ele envia uma mensagem de boas-vindas no canal designado com ID: 1365032024712286353.
import 'dotenv/config';
export default async function handleGuildMemberAdd(member) {
    // Tornar o ID do canal de boas-vindas configurável via variável de ambiente
    const welcomeChannelId = process.env.WELCOME_CHANNEL_ID || '1365032024712286353';
    try {
        // Busca o canal de boas-vindas pelo ID configurável
        const welcomeChannel = member.guild.channels.cache.get(welcomeChannelId);
        if (!welcomeChannel) {
            console.error(`Canal de boas-vindas com ID "${welcomeChannelId}" não encontrado.`);
            return;
        }
        // Adicionar instruções básicas sobre regras, banimentos, vinculação e denúncias
        await welcomeChannel.send(`🎉 Bem-vindo(a) ao servidor! Estamos felizes em tê-lo(a) aqui. Certifique-se de ler as regras e aproveitar sua estadia.

📜 **Regras do Servidor:**
1. Respeite todos os membros.
2. Não use linguagem ofensiva ou discriminatória.
3. Evite spam ou flood nos canais.

🚨 **Banimentos:**
Comportamentos como discurso de ódio, racismo, sexismo ou assédio resultarão em banimento imediato.

🔗 **Vincule sua conta Riot:**
Use o comando "/vincular" para vincular sua conta Riot ao Discord e acessar recursos exclusivos.

📢 **Denúncias:**
Se encontrar comportamento inadequado, use o comando "/report" para denunciar o usuário.`);
    }
    catch (error) {
        console.error('Erro ao processar o evento guildMemberAdd:', error);
    }
}
