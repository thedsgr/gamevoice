import { countLinkedRiotIds } from './users';
import db from '../utils/db.js';

describe('countLinkedRiotIds', () => {
  beforeAll(async () => {
    await db('users').insert([
      { userId: '1', riotId: 'riot1', lastInteraction: Date.now() },
      { userId: '2', riotId: 'riot2', lastInteraction: Date.now() },
    ]);
  });

  it('deve retornar o número correto de Riot IDs vinculados', () => {
    const count = countLinkedRiotIds();
    expect(count).toBe(2);
  });

  afterAll(async () => {
    await db('users').del();
  });
});