/** Representa uma conta Riot vinculada */
export interface RiotAccount {
  riotId: string; // ID da conta Riot (ex: "Player#BR1")
  puuid: string; // Identificador único do jogador (PUUID)
  gameName: string; // Nome do jogador no jogo
  tagLine: string; // Tagline do jogador (ex: #BR1)
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

