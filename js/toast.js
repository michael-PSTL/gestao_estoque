// Avisos curtos no canto da tela. tipo: 'ok' (sucesso), 'erro' ou 'aviso'.
const area = document.createElement('div');
area.className = 'toasts';
area.setAttribute('aria-live', 'polite'); // leitores de tela anunciam cada aviso novo
document.body.append(area);

export function mostrarAviso(mensagem, tipo = 'ok') {
  const aviso = document.createElement('div');
  aviso.className = `toast toast--${tipo}`;
  aviso.setAttribute('role', tipo === 'erro' ? 'alert' : 'status');
  aviso.textContent = mensagem; // textContent: o texto nunca é interpretado como HTML
  area.append(aviso);
  setTimeout(() => aviso.remove(), 5000);
}
