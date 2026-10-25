// Barra lateral: menu de navegação + campo do saldo mensal (guardado no banco pelo back-end).
import { obterSaldo, salvarSaldo } from './api.js';
import { VALOR_MAXIMO } from './config.js';

const MENU = [
  { pagina: 'cadastro', link: 'index.html', nome: 'Cadastro', icone: 'M12 5v14M5 12h14' },
  { pagina: 'estoque', link: 'estoque.html', nome: 'Estoque', icone: 'M21 8l-9-5-9 5v8l9 5 9-5V8zM3 8l9 5 9-5M12 13v8' },
  { pagina: 'financeiro', link: 'financeiro.html', nome: 'Ganhos e gastos', icone: 'M4 20V10M10 20V4M16 20v-7M22 20H2' }
];

function montarMenu(paginaAtual) {
  return MENU.map((item) => `
    <li>
      <a class="nav__link" href="${item.link}"${item.pagina === paginaAtual ? ' aria-current="page"' : ''}>
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="${item.icone}"/></svg>
        <span>${item.nome}</span>
      </a>
    </li>`).join('');
}

export function iniciarSidebar(paginaAtual) {
  document.getElementById('sidebar').innerHTML = `
    <div class="brand">Controle<span>De</span>Estoque</div>
    <nav class="nav" aria-label="Navegação principal">
      <ul class="nav__list">${montarMenu(paginaAtual)}</ul>
    </nav>
    <form class="saldo" id="form-saldo" novalidate>
      <label for="saldo-mensal">Saldo mensal (R$)</label>
      <div class="saldo__row">
        <input id="saldo-mensal" type="number" min="0" step="0.01" inputmode="decimal" placeholder="0,00" required aria-describedby="saldo-msg">
        <button type="submit" class="btn btn--primary btn--sm">Salvar</button>
      </div>
      <p id="saldo-msg" class="saldo__msg" role="status"></p>
    </form>`;

  const form = document.getElementById('form-saldo');
  const campo = document.getElementById('saldo-mensal');
  const mensagem = document.getElementById('saldo-msg');
  const botao = form.querySelector('button');

  function mostrarMensagem(texto, erro) {
    mensagem.textContent = texto;
    mensagem.classList.toggle('saldo__msg--erro', erro);
  }

  async function carregarSaldo() {
    try {
      const saldo = await obterSaldo();
      campo.value = saldo.saldoMensal.toFixed(2);
    } catch (erro) {
      mostrarMensagem('Não foi possível carregar o saldo.', true);
    }
  }

  form.addEventListener('submit', async (evento) => {
    evento.preventDefault();

    const valor = Math.round(Number.parseFloat(campo.value) * 100) / 100;
    if (Number.isNaN(valor) || valor < 0 || valor > VALOR_MAXIMO) {
      campo.setAttribute('aria-invalid', 'true');
      mostrarMensagem('Informe um valor de 0 a 9.999.999.999,99.', true);
      campo.focus();
      return;
    }
    campo.setAttribute('aria-invalid', 'false');

    botao.disabled = true;
    try {
      await salvarSaldo(valor);
      campo.value = valor.toFixed(2);
      mostrarMensagem('Saldo salvo. Este valor será somado de novo todo mês, neste mesmo dia.', false);
      // Avisa a página aberta (ex.: Ganhos e gastos) para recarregar os números.
      document.dispatchEvent(new CustomEvent('saldo:atualizado'));
    } catch (erro) {
      mostrarMensagem(erro.message, true);
    } finally {
      botao.disabled = false;
    }
  });

  carregarSaldo();
}
