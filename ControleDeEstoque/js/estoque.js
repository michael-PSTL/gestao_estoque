// Página "Estoque": tabela com todos os itens, busca, edição e exclusão.
import { editarProduto, excluirProduto, listarProdutos } from './api.js';
import { iniciarSidebar } from './sidebar.js';
import { mostrarAviso } from './toast.js';
import {
  definirOcupado, escapar, formatarCategoria, formatarMoeda,
  lerFormulario, mostrarErros, preencherCategorias, totalDoProduto, validarProduto
} from './utils.js';

iniciarSidebar('estoque');

const corpo = document.getElementById('corpo-estoque');
const resumo = document.getElementById('resumo-estoque');
const campoBusca = document.getElementById('busca');
const dialogEditar = document.getElementById('dlg-editar');
const formEditar = document.getElementById('form-editar');
const dialogExcluir = document.getElementById('dlg-excluir');
const botaoExcluir = document.getElementById('btn-confirmar-exclusao');

let produtos = [];       // todos os produtos carregados do back-end
let idEditando = null;   // produto aberto na janela de edição
let idExcluindo = null;  // produto aberto na janela de exclusão

preencherCategorias(document.getElementById('e-categoria'));

const ordenarPorNome = (lista) => [...lista].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));

// ----- Tabela -----
function mostrarMensagem(texto, { erro = false, tentarDeNovo = false } = {}) {
  resumo.textContent = '';
  corpo.innerHTML = `
    <tr>
      <td colspan="6" class="state${erro ? ' state--error' : ''}">
        <p>${escapar(texto)}</p>
        ${tentarDeNovo ? '<button type="button" class="btn btn--ghost btn--sm" id="btn-tentar">Tentar de novo</button>' : ''}
      </td>
    </tr>`;
  document.getElementById('btn-tentar')?.addEventListener('click', carregar);
}

function montarLinha(produto) {
  const nome = escapar(produto.nome);
  return `
    <tr>
      <td class="nome">${nome}</td>
      <td><span class="badge">${escapar(formatarCategoria(produto.categoria))}</span></td>
      <td class="num${produto.quantidade === 0 ? ' qtd--zero' : ''}">${produto.quantidade}</td>
      <td class="num">${formatarMoeda(produto.precoUnitario)}</td>
      <td class="num">${formatarMoeda(totalDoProduto(produto))}</td>
      <td class="acoes">
        <div class="acoes__grupo">
          <button type="button" class="btn btn--ghost btn--sm" data-acao="editar" data-id="${produto.id}" aria-label="Editar ${nome}">Editar</button>
          <button type="button" class="btn btn--ghost btn--sm" data-acao="excluir" data-id="${produto.id}" aria-label="Excluir ${nome}">Excluir</button>
        </div>
      </td>
    </tr>`;
}

// Desenha a tabela aplicando o filtro da busca (nome ou categoria).
function desenharTabela() {
  const termo = campoBusca.value.trim().toLowerCase();
  const visiveis = produtos.filter((p) =>
    p.nome.toLowerCase().includes(termo) || p.categoria.toLowerCase().includes(termo));

  if (visiveis.length === 0) {
    mostrarMensagem(produtos.length > 0
      ? 'Nenhum item corresponde à busca.'
      : 'O estoque está vazio. Cadastre o primeiro item na página Cadastro.');
    return;
  }

  corpo.innerHTML = visiveis.map(montarLinha).join('');

  const unidades = visiveis.reduce((soma, p) => soma + p.quantidade, 0);
  const valor = visiveis.reduce((soma, p) => soma + totalDoProduto(p), 0);
  resumo.textContent = `${visiveis.length} produto(s) listado(s), ${unidades} unidade(s), valor em estoque de ${formatarMoeda(valor)}.`;
}

async function carregar() {
  mostrarMensagem('Carregando estoque…');
  try {
    produtos = ordenarPorNome(await listarProdutos());
    desenharTabela();
  } catch (erro) {
    mostrarMensagem(erro.message, { erro: true, tentarDeNovo: true });
  }
}

// ----- Editar -----
function abrirEdicao(produto) {
  idEditando = produto.id;
  formEditar.elements.nome.value = produto.nome;
  formEditar.elements.categoria.value = produto.categoria;
  formEditar.elements.quantidade.value = produto.quantidade;
  formEditar.elements.precoUnitario.value = produto.precoUnitario.toFixed(2);
  mostrarErros(formEditar, {});
  dialogEditar.showModal();
  formEditar.elements.quantidade.focus();
}

formEditar.addEventListener('submit', async (evento) => {
  evento.preventDefault();

  const dados = lerFormulario(formEditar);
  const erros = validarProduto(dados);
  mostrarErros(formEditar, erros);
  if (Object.keys(erros).length > 0) return;

  const botao = formEditar.querySelector('[type="submit"]');
  definirOcupado(botao, true);
  try {
    // O back-end devolve o produto já atualizado; ele substitui o antigo na lista.
    const atualizado = await editarProduto(idEditando, dados);
    produtos = ordenarPorNome(produtos.map((p) => (p.id === idEditando ? atualizado : p)));
    desenharTabela();
    dialogEditar.close();
    mostrarAviso('Item atualizado.', 'ok');
  } catch (erro) {
    mostrarAviso(erro.message, 'erro');
    if (erro.status === 404) { // o item foi removido por outra pessoa/aba: recarrega a lista
      dialogEditar.close();
      carregar();
    }
  } finally {
    definirOcupado(botao, false);
  }
});

// ----- Excluir -----
function abrirExclusao(produto) {
  idExcluindo = produto.id;
  document.getElementById('nome-excluir').textContent = produto.nome;
  dialogExcluir.showModal();
}

botaoExcluir.addEventListener('click', async () => {
  definirOcupado(botaoExcluir, true);
  try {
    await excluirProduto(idExcluindo);
    produtos = produtos.filter((p) => p.id !== idExcluindo);
    desenharTabela();
    dialogExcluir.close();
    mostrarAviso('Item excluído.', 'ok');
    campoBusca.focus();
  } catch (erro) {
    mostrarAviso(erro.message, 'erro');
    if (erro.status === 404) { // já não existe mais: recarrega a lista
      dialogExcluir.close();
      carregar();
    }
  } finally {
    definirOcupado(botaoExcluir, false);
  }
});

// ----- Eventos da página -----
// Um único "ouvinte" na tabela atende todos os botões Editar/Excluir.
corpo.addEventListener('click', (evento) => {
  const botao = evento.target.closest('button[data-acao]');
  if (!botao) return;

  const produto = produtos.find((p) => p.id === Number(botao.dataset.id));
  if (!produto) return;

  if (botao.dataset.acao === 'editar') abrirEdicao(produto);
  else abrirExclusao(produto);
});

// Qualquer elemento com data-fechar (botões "Cancelar") fecha a janela em que está.
document.addEventListener('click', (evento) => {
  evento.target.closest('[data-fechar]')?.closest('dialog').close();
});

campoBusca.addEventListener('input', () => {
  if (produtos.length > 0) desenharTabela();
});

carregar();
