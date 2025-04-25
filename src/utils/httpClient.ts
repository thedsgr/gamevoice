// filepath: c:\Users\conta\Downloads\Game Voice\src\utils\httpClient.ts
/**
 * Este arquivo centraliza a configuração do cliente HTTP para interagir com a API da Riot Games.
 * Ele utiliza o Axios para criar uma instância personalizada (`riotClient`) com configurações
 * específicas, como o endpoint base, cabeçalhos de autenticação e tempo limite.
 * 
 * Funcionalidades principais:
 * - Configuração do `riotClient` com o token da API da Riot.
 * - Definição do endpoint base para a região apropriada.
 * - Configuração de um tempo limite para requisições.
 */

import axios from 'axios';
import { config } from '../config.js';

export const riotClient = axios.create({
    baseURL: 'https://br1.api.riotgames.com',
    headers: {
        'X-Riot-Token': config.RIOT_API_KEY,
    },
    timeout: 5000,
});