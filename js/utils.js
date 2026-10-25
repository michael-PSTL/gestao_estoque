// Funções de apoio usadas por várias páginas: formatação, formulários e validação.
import { CATEGORIAS, VALOR_MAXIMO } from './config.js';

const formatoMoeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const formatoData = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

// ----- Formatação -----
export function formatarMoeda(valor) {
  return formatoMoeda.format(valor);
}

// O back-end envia a data em UTC (ex.: "2026-10-23T00:32:30.272Z"); aqui ela vira o horário local.
export function formatarData(texto) {
  const data = new Date(texto);
  return Number.isNaN(data.getTime()) ? '' : formatoData.format(data);
}

// "COMIDA" -> "Comida"
export function formatarCategoria(categoria) {
  return categoria.charAt(0) + categoria.slice(1).toLowerCase();
}

export function totalDoProduto(produto) {
  return Math.round(produto.quantidade * produto.precoUnitario * 100) / 100;
}

// Todo texto vindo do servidor passa por aqui antes de entrar no HTML (evita injeção de código).
export function escapar(texto) {
  const trocas = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  return String(texto).replace(/[&<>"']/g, (caractere) => trocas[caractere]);
}

// ----- Formulário de produto (usado no cadastro e na edição) -----
export function preencherCategorias(select) {
  for (const categoria of CATEGORIAS) {
    select.insertAdjacentHTML('beforeend', `<option value="${categoria}">${formatarCategoria(categoria)}</option>`);
  }
}

// Lê os campos do formulário e converte quantidade e preço para número.
// Valor inválido vira NaN, e a validação abaixo se encarrega de avisar o usuário.
export function lerFormulario(form) {
  const campos = new FormData(form);
  const quantidade = String(campos.get('quantidade')).trim();
  const preco = String(campos.get('precoUnitario')).trim();

  return {
    nome: String(campos.get('nome')).trim(),
    categoria: String(campos.get('categoria')),
    quantidade: /^\d{1,9}$/.test(quantidade) ? Number(quantidade) : NaN,
    precoUnitario: preco === '' ? NaN : Math.round(Number(preco) * 100) / 100
  };
}

// Devolve um objeto com uma mensagem para cada campo inválido. Objeto vazio = tudo certo.
export function validarProduto({ nome, categoria, quantidade, precoUnitario }) {
  const erros = {};

  if (nome.length < 2) erros.nome = 'Informe um nome com ao menos 2 caracteres.';
  else if (nome.length > 100) erros.nome = 'Use no máximo 100 caracteres.';

  if (!CATEGORIAS.includes(categoria)) erros.categoria = 'Selecione uma categoria.';

  if (Number.isNaN(quantidade)) erros.quantidade = 'Informe uma quantidade inteira, de 0 a 999.999.999.';

  if (Number.isNaN(precoUnitario) || precoUnitario < 0 || precoUnitario > VALOR_MAXIMO) {
    erros.precoUnitario = 'Informe um preço válido, de 0 a 9.999.999.999,99.';
  }

  return erros;
}

// Mostra (ou limpa) a mensagem de erro embaixo de cada campo e leva o foco ao primeiro erro.
// Cada campo do HTML tem data-campo="nome" e a mensagem fica em data-erro-de="nome".
export function mostrarErros(form, erros) {
  for (const campo of form.querySelectorAll('[data-campo]')) {
    const mensagem = erros[campo.dataset.campo] || '';
    form.querySelector(`[data-erro-de="${campo.dataset.campo}"]`).textContent = mensagem;
    campo.setAttribute('aria-invalid', mensagem ? 'true' : 'false');
  }
  form.querySelector('[aria-invalid="true"]')?.focus();
}

// Desabilita o botão enquanto espera o servidor, para evitar cliques duplicados.
export function definirOcupado(botao, ocupado) {
  botao.disabled = ocupado;
  botao.setAttribute('aria-busy', String(ocupado));
}
