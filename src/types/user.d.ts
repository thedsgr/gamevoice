import { RiotAccount, Participant } from './shared.js';

export interface User {
  userId: string;       // ID do Discord
  lastInteraction: number; // Timestamp da última interação
  riotAccounts: RiotAccount[]; // Garantir que seja um array válido
  riotId: string;       // ID principal da conta Riot
  riotPuuid?: string;   // PUUID da conta principal
  lastMatchPlayers?: { id: string; name: string }[];
  users?: any[]; // Lista de usuários (não utilizado atualmente)
}

/** Representa um invocador (Summoner) */
export interface Summoner {
  id: string; // ID do invocador
  accountId: string; // ID da conta
  puuid: string; // Identificador único do jogador (PUUID)
  profileIconId: number; // ID do ícone de perfil
  revisionDate: number; // Data da última atualização
}

/** Representa a resposta da API para uma partida ativa */
export interface ActiveGameResponse {
  participants: Participant[]; // Lista de participantes na partida
  gameMode: string; // Modo de jogo (ex: "CLASSIC")
  gameType: string; // Tipo de jogo (ex: "MATCHED_GAME")
  discordUserId: string; // ID do usuário no Discord
  gameId: number;
  teams: {
      teamId: number;
      discordUserIds: string[];
  }[];
}

interface DBUser {
  userId: string;
  riotAccounts: Array<{
    riotId: string;
    puuid?: string;
    gameName?: string;
    tagLine?: string;
  }>;
  riotId?: string;
  lastInteraction?: number;
  riotPuuid?: string;
}

/** Representa um erro retornado pela API da Riot */
export interface RiotAPIError {
  status?: {
    message?: string;
    status_code?: number;
  };
  [key: string]: any;
}

/** Representa um usuário restrito */
export interface RestrictedUser {
  userId: string; // ID do usuário restrito
  until: number; // Timestamp até quando a restrição é válida
  reason?: string; // Motivo da restrição
}

/** Resposta da API da Riot para informações de conta */
export interface RiotAccountResponse {
  puuid: string; // Identificador único da Riot (PUUID)
  gameName: string; // Nome do jogador no jogo
  tagLine: string; // Tagline do jogador (ex: #BR1)
}

export type {
  Summoner,
  ActiveGameResponse,
  RiotAPIError
};