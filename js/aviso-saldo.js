// Aviso de saldo, usado depois de cadastrar ou aumentar o valor de um item.
import { obterResumo } from './api.js';
import { mostrarAviso } from './toast.js';
import { formatarMoeda } from './utils.js';

// Pergunta ao back-end se o saldo disponível ficou negativo e, se ficou, avisa o usuário.
export async function avisarSeSaldoExcedido() {
  try {
    const resumo = await obterResumo();
    // Com total creditado 0 o usuário ainda não definiu o saldo, então não há o que avisar.
    if (resumo.totalCreditado > 0 && resumo.excedeuSaldo) {
      mostrarAviso(`Atenção: os itens passaram ${formatarMoeda(-resumo.saldoDisponivel)} do saldo disponível.`, 'aviso');
    }
  } catch (erro) {
    // A operação principal já foi salva; falhar só neste aviso não deve atrapalhar o usuário.
    console.warn('Não foi possível verificar o saldo:', erro.message);
  }
}
