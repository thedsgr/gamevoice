declare namespace NodeJS {
  interface ProcessEnv {
    /**
     * Token do bot do Discord.
     * Obtido no portal de desenvolvedores do Discord.
     */
    BOT_TOKEN: string;

    /**
     * ID do cliente do bot (application ID).
     * Obtido no portal de desenvolvedores do Discord.
     */
    CLIENT_ID: string;

    /**
     * ID do servidor (guild) onde os comandos serão registrados.
     */
    GUILD_ID: string;
  }
}