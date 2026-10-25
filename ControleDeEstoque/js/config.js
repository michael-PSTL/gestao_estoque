// Configurações gerais do front-end.

// Endereço do back-end (FastAPI). Troque aqui se o servidor mudar de porta ou for hospedado.
export const API_URL = 'http://localhost:8000/api';

// Tempo máximo de espera por uma resposta do servidor.
export const TEMPO_LIMITE_MS = 10000;

// Mesmas categorias aceitas pelo back-end.
export const CATEGORIAS = ['HIGIENE', 'COMIDA', 'LIMPEZA', 'OUTRO'];

// Quantos itens aparecem em "Últimos itens adicionados".
export const ULTIMOS_ITENS = 4;

// Maior valor em reais aceito pelo back-end (12 dígitos, 2 casas decimais).
export const VALOR_MAXIMO = 9999999999.99;
