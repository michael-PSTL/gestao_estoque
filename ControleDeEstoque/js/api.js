// Comunicação com o back-end: cada função abaixo corresponde a uma rota da API.
import { API_URL, TEMPO_LIMITE_MS } from './config.js';

// Faz a requisição e devolve o JSON da resposta.
// Se algo der errado, lança um Error com uma mensagem que pode ser mostrada ao usuário.
async function requisicao(caminho, { metodo = 'GET', corpo } = {}) {
  let resposta;

  try {
    resposta = await fetch(API_URL + caminho, {
      method: metodo,
      headers: corpo ? { 'Content-Type': 'application/json' } : {},
      body: corpo ? JSON.stringify(corpo) : undefined,
      signal: AbortSignal.timeout(TEMPO_LIMITE_MS)
    });
  } catch (erro) {
    if (erro.name === 'TimeoutError') {
      throw new Error('O servidor demorou demais para responder.');
    }
    throw new Error('Não foi possível conectar ao servidor. Verifique se o back-end está rodando.');
  }

  // O back-end sempre responde em JSON; se não for JSON, "dados" fica nulo.
  const dados = await resposta.json().catch(() => null);

  if (!resposta.ok) {
    // Nos erros, o back-end envia { "message": "texto para o usuário" }.
    const erro = new Error(dados?.message || `O servidor respondeu com erro ${resposta.status}.`);
    erro.status = resposta.status;
    throw erro;
  }

  return dados;
}

// ----- Produtos -----
export const listarProdutos = () => requisicao('/produtos');
export const listarRecentes = (limite) => requisicao(`/produtos?ordem=recentes&limit=${limite}`);
export const criarProduto = (produto) => requisicao('/produtos', { metodo: 'POST', corpo: produto });
export const editarProduto = (id, produto) => requisicao(`/produtos/${id}`, { metodo: 'PUT', corpo: produto });
export const excluirProduto = (id) => requisicao(`/produtos/${id}`, { metodo: 'DELETE' });

// ----- Financeiro -----
export const obterSaldo = () => requisicao('/saldo');
export const salvarSaldo = (saldoMensal) => requisicao('/saldo', { metodo: 'PUT', corpo: { saldoMensal } });
export const obterResumo = () => requisicao('/financeiro/resumo');
