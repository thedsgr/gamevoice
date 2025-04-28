// filepath: c:\Users\conta\Downloads\Game Voice\src\utils\errorHandler.ts
/**
 * Este arquivo centraliza o tratamento de erros relacionados à API da Riot Games.
 * Ele fornece uma classe personalizada `ApiError` para encapsular erros e uma função
 * `handleApiError` para lidar com erros de requisições HTTP, diferenciando entre erros
 * críticos (5xx) e não críticos.
 *
 * Funcionalidades principais:
 * - Classe `ApiError` para representar erros com status HTTP.
 * - Função `handleApiError` para capturar e tratar erros do Axios.
 */
import axios from 'axios';
export class ApiError extends Error {
    constructor(message, status) {
        super(message);
        this.status = status;
        Object.setPrototypeOf(this, ApiError.prototype);
    }
}
export function handleApiError(error, context) {
    if (axios.isAxiosError(error)) {
        const axiosError = error;
        const statusCode = axiosError.response?.status || 500;
        const message = axiosError.response?.data?.status?.message || axiosError.message || 'Erro desconhecido';
        console.error(`Erro na API da Riot (${context}): ${message}`);
        if (statusCode >= 500) {
            throw new ApiError(`Erro crítico: ${message}`, statusCode);
        }
        return new ApiError(`Erro não crítico: ${message}`, statusCode);
    }
    console.error(`Erro desconhecido (${context}):`, error instanceof Error ? error : new Error(String(error)));
    return new ApiError('Erro desconhecido ao acessar a API da Riot.', 500);
}
