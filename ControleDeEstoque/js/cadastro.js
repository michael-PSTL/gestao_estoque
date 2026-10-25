// Página "Cadastro": formulário de novo produto + lista dos últimos itens adicionados.
import { criarProduto, listarRecentes, obterResumo } from './api.js';
import { ULTIMOS_ITENS } from './config.js';
import { iniciarSidebar } from './sidebar.js';
import { mostrarAviso } from './toast.js';
import {
  definirOcupado, escapar, formatarCategoria, formatarData, formatarMoeda,
  lerFormulario, mostrarErros, preencherCategorias, totalDoProduto, validarProduto
} from './utils.js';

iniciarSidebar('cadastro');

const form = document.getElementById('form-produto');
const lista = document.getElementById('lista-recentes');
const botao = document.getElementById('btn-adicionar');

preencherCategorias(document.getElementById('categoria'));

// ----- Lista dos últimos itens -----
function mostrarMensagem(texto, { erro = false, tentarDeNovo = false } = {}) {
  lista.innerHTML = `
    <li class="state recentes-vazio${erro ? ' state--error' : ''}">
      <p>${escapar(texto)}</p>
      ${tentarDeNovo ? '<button type="button" class="btn btn--ghost btn--sm" id="btn-tentar">Tentar de novo</button>' : ''}
    </li>`;
  document.getElementById('btn-tentar')?.addEventListener('click', carregarRecentes);
}

function montarCartao(produto) {
  return `
    <li class="recente">
      <div class="recente__topo">
        <span class="recente__nome">${escapar(produto.nome)}</span>
        <span class="badge">${escapar(formatarCategoria(produto.categoria))}</span>
      </div>
      <p class="recente__calculo">${produto.quantidade} un. × ${formatarMoeda(produto.precoUnitario)}</p>
      <p class="recente__total">Total: ${formatarMoeda(totalDoProduto(produto))}</p>
      <p class="recente__data">${formatarData(produto.criadoEm)}</p>
    </li>`;
}

async function carregarRecentes() {
  mostrarMensagem('Carregando itens…');
  try {
    // O back-end já devolve os mais recentes primeiro (ordem=recentes).
    const produtos = await listarRecentes(ULTIMOS_ITENS);
    if (produtos.length === 0) {
      mostrarMensagem('Nenhum item adicionado ainda. Preencha o formulário acima para começar.');
      return;
    }
    lista.innerHTML = produtos.map(montarCartao).join('');
  } catch (erro) {
    mostrarMensagem(erro.message, { erro: true, tentarDeNovo: true });
  }
}

// ----- Aviso de saldo -----
// Depois de salvar um item, pergunta ao back-end se o total passou do saldo mensal.
async function avisarSeSaldoExcedido() {
  try {
    const resumo = await obterResumo();
    // Com total creditado 0 o usuário ainda não definiu o saldo, então não há o que avisar.
    if (resumo.totalCreditado > 0 && resumo.excedeuSaldo) {
      mostrarAviso(`Atenção: os itens cadastrados passaram ${formatarMoeda(-resumo.saldoRestante)} do saldo disponível.`, 'aviso');
    }
  } catch (erro) {
    // O item já foi salvo; falhar só neste aviso não deve atrapalhar o usuário.
    console.warn('Não foi possível verificar o saldo:', erro.message);
  }
}

// ----- Envio do formulário -----
form.addEventListener('submit', async (evento) => {
  evento.preventDefault();

  const dados = lerFormulario(form);
  const erros = validarProduto(dados);
  mostrarErros(form, erros);
  if (Object.keys(erros).length > 0) return;

  definirOcupado(botao, true);
  try {
    await criarProduto(dados);
    mostrarAviso(`"${dados.nome}" adicionado ao estoque.`, 'ok');
    form.reset();
    document.getElementById('nome').focus();
    await carregarRecentes();
    await avisarSeSaldoExcedido();
  } catch (erro) {
    mostrarAviso(erro.message, 'erro');
  } finally {
    definirOcupado(botao, false);
  }
});

carregarRecentes();
