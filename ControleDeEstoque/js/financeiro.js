// Página "Ganhos e gastos": mostra o resumo calculado pelo back-end (GET /financeiro/resumo).
import { obterResumo } from './api.js';
import { iniciarSidebar } from './sidebar.js';
import { escapar, formatarCategoria, formatarMoeda } from './utils.js';

iniciarSidebar('financeiro');

const painel = document.getElementById('painel');
const estado = document.getElementById('estado');
const alerta = document.getElementById('alerta');

function mostrarMensagem(texto, { erro = false, tentarDeNovo = false } = {}) {
  painel.hidden = true;
  estado.innerHTML = `
    <div class="state${erro ? ' state--error' : ''}">
      <p>${escapar(texto)}</p>
      ${tentarDeNovo ? '<button type="button" class="btn btn--ghost btn--sm" id="btn-tentar">Tentar de novo</button>' : ''}
    </div>`;
  document.getElementById('btn-tentar')?.addEventListener('click', carregar);
}

// Mensagem principal da página: saldo estourado, dentro do saldo ou saldo ainda não definido.
function desenharAlerta(resumo) {
  if (resumo.totalCreditado === 0) {
    alerta.innerHTML = '<div class="alerta">Defina o saldo mensal no campo da barra lateral para acompanhar seus gastos.</div>';
  } else if (resumo.excedeuSaldo) {
    const excedente = formatarMoeda(-resumo.saldoRestante);
    alerta.innerHTML = `<div class="alerta" role="alert">Atenção: os itens cadastrados passaram ${excedente} do saldo creditado.</div>`;
  } else {
    alerta.innerHTML = `<div class="alerta alerta--ok">Dentro do saldo: ainda restam ${formatarMoeda(resumo.saldoRestante)}.</div>`;
  }
}

// Barra de progresso: a parte azul é o gasto dentro do saldo creditado, a listrada é o que passou dele,
// e a marca amarela fica na posição do saldo. A escala é o maior valor entre saldo e gasto.
function desenharMedidor(resumo) {
  const { totalCreditado: saldo, totalGasto, excedeuSaldo } = resumo;
  const escala = Math.max(saldo, totalGasto, 0.01);
  const porcentagem = (valor) => `${((valor / escala) * 100).toFixed(2)}%`;

  document.getElementById('meter-ok').style.width = porcentagem(Math.min(totalGasto, saldo));
  document.getElementById('meter-over').style.left = porcentagem(saldo);
  document.getElementById('meter-over').style.width = porcentagem(Math.max(0, totalGasto - saldo));
  document.getElementById('meter-limite').style.left = `calc(${porcentagem(saldo)} - 1.5px)`;

  let usado = 0;
  if (saldo > 0) usado = (totalGasto / saldo) * 100;
  else if (totalGasto > 0) usado = 100;

  const texto = `${usado.toFixed(0)}% do saldo utilizado (${formatarMoeda(totalGasto)} de ${formatarMoeda(saldo)})`;
  document.getElementById('meter-texto').textContent = texto;

  const medidor = document.getElementById('meter');
  medidor.setAttribute('aria-valuenow', String(Math.min(100, Math.round(usado))));
  medidor.setAttribute('aria-valuetext', excedeuSaldo ? `${texto}, saldo excedido` : texto);
}

function desenharCategorias(porCategoria) {
  const lista = document.getElementById('lista-categorias');

  if (porCategoria.length === 0) {
    lista.innerHTML = '<li class="muted">Nenhum gasto registrado ainda.</li>';
    return;
  }

  // A barra de cada categoria é proporcional à maior categoria.
  const maior = Math.max(...porCategoria.map((c) => c.total), 0.01);
  lista.innerHTML = porCategoria.map((c) => `
    <li class="cat">
      <div class="cat__linha">
        <span>${escapar(formatarCategoria(c.categoria))}</span>
        <strong>${formatarMoeda(c.total)}</strong>
      </div>
      <div class="cat__barra" aria-hidden="true"><span style="width: ${((c.total / maior) * 100).toFixed(2)}%"></span></div>
    </li>`).join('');
}

// "2026-08-09" (data pura, sem hora) -> "09/08/2026". Não passa por Date para não mudar de dia por causa do fuso.
function formatarDiaSimples(texto) {
  const [ano, mes, dia] = texto.split('-');
  return `${dia}/${mes}/${ano}`;
}

function desenharRenovacao(resumo) {
  const linha = document.getElementById('renovacao');
  if (!resumo.proximaRenovacao) {
    linha.textContent = '';
    return;
  }
  linha.textContent = `Entram ${formatarMoeda(resumo.saldoMensal)} por mês. Próxima renovação: ${formatarDiaSimples(resumo.proximaRenovacao)}.`;
}

function desenharPainel(resumo) {
  estado.innerHTML = '';
  painel.hidden = false;

  document.getElementById('kpi-saldo').textContent = formatarMoeda(resumo.totalCreditado);
  document.getElementById('kpi-gasto').textContent = formatarMoeda(resumo.totalGasto);
  document.getElementById('kpi-restante').textContent = formatarMoeda(resumo.saldoRestante);
  document.getElementById('kpi-restante-box').classList.toggle('kpi--negativo', resumo.excedeuSaldo);

  desenharRenovacao(resumo);
  desenharAlerta(resumo);
  desenharMedidor(resumo);
  desenharCategorias(resumo.porCategoria);
}

async function carregar() {
  mostrarMensagem('Carregando resumo…');
  try {
    desenharPainel(await obterResumo());
  } catch (erro) {
    mostrarMensagem(erro.message, { erro: true, tentarDeNovo: true });
  }
}

// Quando o saldo é salvo na barra lateral, os números são recarregados.
document.addEventListener('saldo:atualizado', carregar);

carregar();
