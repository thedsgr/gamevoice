import { RiotAccount } from "../types/shared.js";
import { User } from "../types/user.d.js";


export function validateRiotAccount(account: any): RiotAccount {
  if (!account.riotId) throw new Error("Riot ID é obrigatório");

  const [gameName, tagLine] = account.riotId.includes('#') 
    ? account.riotId.split('#') 
    : [account.riotId, ''];

  return {
    riotId: account.riotId,
    puuid: account.puuid || '',
    gameName: account.gameName || gameName,
    tagLine: account.tagLine || tagLine,
    lastVerified: account.lastVerified || Date.now()
  };
}

export function validateUser(user: any): User {
  return {
    userId: user.userId,
    lastInteraction: user.lastInteraction || Date.now(),
    riotAccounts: (user.riotAccounts || []).map(validateRiotAccount),
    riotId: user.riotId || '',
    riotPuuid: user.riotPuuid
  };
}