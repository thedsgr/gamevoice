export default async function handleButtonInteraction(interaction) {
    try {
        // Lógica para lidar com interações de botões
        await interaction.reply({
            content: `Você pressionou o botão com ID: ${interaction.customId}`,
            ephemeral: true,
        });
    }
    catch (error) {
        console.error(`❌ Erro ao lidar com o botão ${interaction.customId}:`, error);
    }
}
