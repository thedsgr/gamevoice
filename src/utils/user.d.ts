/** Representa um usuário no sistema */
export interface User {
  discordId: string; // ID do usuário no Discord
  riotAccounts: RiotAccount[]; // Contas Riot vinculadas
  lastInteraction: number; // Timestamp da última interação
  riotId?: string; // Riot ID no formato Nome#1234
  riotPuuid?: string; // Identificador único da Riot
  severeOffenses?: number; // Número de infrações graves
}

/** Representa uma conta Riot vinculada */
export interface RiotAccount {
  riotId: string; // Riot ID no formato Nome#1234
  puuid: string; // Identificador único da Riot
}

/** Representa um usuário restrito */
export interface RestrictedUser {
  userId: string; // ID do usuário restrito
  until: number; // Timestamp até quando a restrição é válida
  reason?: string; // Motivo da restrição
}