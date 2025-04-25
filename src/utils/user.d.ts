import { RiotAccount, Participant } from './shared.d.js';

/** Representa um usuário no sistema */
export interface User {
  discordId: string; // ID do usuário no Discord
  riotAccounts: RiotAccount[]; // Contas Riot vinculadas
  lastInteraction: number; // Timestamp da última interação
  riotId?: string; // Riot ID no formato Nome#1234
  riotPuuid?: string; // Identificador único da Riot (PUUID)
  severeOffenses?: number; // Número de infrações graves
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