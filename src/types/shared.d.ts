/** Representa uma conta Riot vinculada */
export interface RiotAccount {
  riotId: string;       // Formato: "gameName#tagLine"
  puuid: string;        // Identificador único da Riot
  gameName: string;     // Nome do jogo (parte antes do #)
  tagLine: string;      // Tag (parte depois do #)
  lastVerified?: number; // Timestamp da última verificação
  summonerId?: string; // ID do invocador
}

/** Representa um participante de uma partida */
export interface Participant {
  championId: number; // ID do campeão
  summonerId: string;
  puuid: string; // Identificador único do jogador (PUUID)
  teamId: number; // ID da equipe
  spell1Id: number; // ID do primeiro feitiço
  spell2Id: number; // ID do segundo feitiço
  summonerName: string; // Nome do invocador
  [key: string]: any; // Para propriedades adicionais
}

/** Representa os dados de uma equipe em uma partida */
export interface TeamData {
  matchId: string;
  teamId: number;
  teamPlayers: TeamPlayer[];
}

export interface RawRiotAccount {
  riotId: string;
  puuid?: string;
  gameName?: string;
  tagLine?: string;
}

export interface RawUser {
  userId: string;
  riotAccounts: RawRiotAccount[];
  lastInteraction?: number;
  riotId?: string;
  riotPuuid?: string;
  lastMatchPlayers?: any[]; // Add this property to match the usage in the code
}

