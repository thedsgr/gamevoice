import { ExtendedClient } from '../structs/ExtendedClient.js';
import { ChannelType, TextChannel } from 'discord.js';

const client = new ExtendedClient({
    intents: ['Guilds', 'GuildMessages', 'GuildMembers'], // Adicione os intents necessários
});

const WELCOME_CHANNEL_ID = process.env.WELCOME_CHANNEL_ID || '1365032024712286353';

client.once('ready', async () => {
    const channel = client.channels.cache.get(WELCOME_CHANNEL_ID);

    if (!channel || channel.type !== ChannelType.GuildText) {
        console.error('Canal de boas-vindas não encontrado ou não é um canal de texto.');
        return;
    }

    const welcomeChannel = channel as TextChannel;

    const welcomeMessage = `🎉 Bem-vindo(a) ao servidor! Estamos felizes em tê-lo(a) aqui. Certifique-se de ler as regras e aproveitar sua estadia.

📜 **Regras do Servidor:**
1. Respeite todos os membros.
2. Não use linguagem ofensiva ou discriminatória.
3. Evite spam ou flood nos canais.

🚨 **Banimentos:**
Comportamentos como discurso de ódio, racismo, sexismo ou assédio resultarão em banimento imediato.

🔗 **Vincule sua conta Riot:**
Use o comando "/vincular" para vincular sua conta Riot ao Discord e acessar recursos exclusivos.

📢 **Denúncias:**
Se encontrar comportamento inadequado, use o comando "/report" para denunciar o usuário.`;

    try {
        await welcomeChannel.send(welcomeMessage);
        console.log('Mensagem de boas-vindas enviada com sucesso!');
    } catch (error) {
        console.error('Erro ao enviar a mensagem de boas-vindas:', error);
    } finally {
        client.destroy(); // Encerra o bot após enviar a mensagem
    }
});

client.login(process.env.DISCORD_TOKEN);