import { SlashCommandBuilder } from '@discordjs/builders';
import { linkRiotAccount } from '../services/users.js';
import { fetchRiotPuuid } from '../utils/riotAPI.js';
export default {
    data: new SlashCommandBuilder()
        .setName('vincular')
        .setDescription('Vincula sua conta Riot ao Discord')
        .addStringOption(option => option
        .setName('riotid')
        .setDescription('Seu Riot ID (ex: nome#BR1)')
        .setRequired(true)
        .setMaxLength(30) // Limite razoável
        .setMinLength(3) // Mínimo para nome#tag
    ),
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });
        const discordId = interaction.user.id;
        const riotId = interaction.options.getString('riotid', true);
        // Validação básica do formato
        if (!riotId.includes('#')) {
            await interaction.editReply('❌ Formato inválido. Use: nome#tag');
            return;
        }
        try {
            const puuid = await fetchRiotPuuid(riotId); // Deverá ser implementada
            if (!puuid)
                throw new Error('Conta Riot não encontrada');
            await linkRiotAccount(discordId, riotId, puuid);
            await interaction.editReply(`✅ Conta Riot (${riotId}) vinculada com sucesso!`);
        }
        catch (error) {
            console.error('Erro ao vincular conta:', error);
            await interaction.editReply('❌ Erro ao vincular conta. Verifique o Riot ID e tente novamente.');
        }
    },
};
