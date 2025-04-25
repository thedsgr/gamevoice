// src/events/guildMemberAdd.ts
import { GuildMember, ChannelType, TextChannel } from 'discord.js';

export default async function handleGuildMemberAdd(member: GuildMember) {
  // Encontrar o canal de boas-vindas
  const welcomeChannel = member.guild.channels.cache.find(
    (channel) => channel.name === 'boas-vindas' && channel.type === ChannelType.GuildText
  ) as TextChannel | undefined;

  if (!welcomeChannel) {
    console.error('Canal de boas-vindas não encontrado.');
    return;
  }

  try {
    // Enviar mensagem de boas-vindas
    await welcomeChannel.send(
      `🎉 Bem-vindo(a), ${member.user}! Certifique-se de ler as regras e se preparar para as partidas.`
    );

    // Adicionar o cargo "Invocadores"
    const role = member.guild.roles.cache.find((r) => r.name === 'Invocadores');
    if (role) {
      await member.roles.add(role);
      console.log(`Cargo "Invocadores" atribuído a ${member.user.tag}.`);
    } else {
      console.error('Cargo "Invocadores" não encontrado.');
    }
  } catch (error) {
    console.error('Erro ao enviar mensagem de boas-vindas:', error);
  }
}
