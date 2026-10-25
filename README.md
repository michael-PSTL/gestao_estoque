# ControleDeEstoque (front-end)

Interface em HTML, CSS e JavaScript puro (módulos ES, sem build) que consome a API `gestao_financeira`.

## Como rodar (dois terminais)
1. **Back-end** (pasta `gestao_financeira`): `uvicorn main:app --reload --port 8000`
2. **Front-end** (esta pasta): `npx serve .` (ou `python -m http.server 5500`) e abrir o endereço mostrado.

> Abrir o `index.html` com duplo clique **não funciona**: módulos ES e CORS exigem um servidor (localhost).
> O endereço do back-end fica em `js/config.js` (`API_URL`).

## Estrutura
| Arquivo | Responsabilidade |
|---|---|
| `index.html`, `estoque.html`, `financeiro.html` | Páginas (Cadastro, Estoque, Ganhos e gastos) |
| `js/config.js` | Constantes: URL da API, categorias, limites |
| `js/api.js` | Uma função por rota da API (`fetch`) e tratamento de erros de rede |
| `js/utils.js` | Formatação (moeda, data), leitura e validação de formulário |
| `js/toast.js` | Avisos no canto da tela |
| `js/aviso-saldo.js` | Avisa quando o saldo disponível fica negativo (cadastro e edição) |
| `js/sidebar.js` | Menu lateral + saldo mensal |
| `js/cadastro.js`, `estoque.js`, `financeiro.js` | Lógica de cada página |
| `css/` | `base.css` (comum) + um CSS por página |

## Rotas usadas
| Método | Rota | Uso |
|---|---|---|
| GET | `/api/produtos` | Tabela do estoque |
| GET | `/api/produtos?ordem=recentes&limit=4` | Últimos itens do cadastro |
| POST | `/api/produtos` | Cadastrar item |
| PUT | `/api/produtos/{id}` | Editar item |
| DELETE | `/api/produtos/{id}` | Excluir item |
| GET / PUT | `/api/saldo` | Ler e salvar o saldo mensal |
| GET | `/api/financeiro/resumo` | Página Ganhos e gastos (creditado, gasto, saldo disponível e próxima renovação) |

Erros da API chegam como `{ "message": "..." }` e aparecem para o usuário em avisos ou na própria tela.

## Saldo mensal e saldo disponível
- O **saldo mensal** (barra lateral) é um valor fixo que entra todo mês, sempre no dia em que foi salvo pela primeira vez (ex.: R$ 200,00 salvos em 09/07 → mais R$ 200,00 em 09/08).
- O **saldo disponível** fica gravado no back-end: diminui ao cadastrar itens (e ao encarecê-los) e **não volta** ao excluir ou diminuir um item. Pode ficar negativo, e o sistema avisa.
- O front só exibe os números que o back-end devolve (`totalCreditado`, `totalGasto`, `saldoDisponivel`, `proximaRenovacao`).

## Cuidados que o código já toma
- Todo texto vindo do servidor passa por `escapar()` ou `textContent` (evita XSS).
- Validação no front espelha a do back-end (nome 2–100 caracteres, quantidade inteira, preço de 0 a 9.999.999.999,99).
- Botões ficam desabilitados durante o envio; falhas de rede e tempo esgotado mostram mensagem clara com "Tentar de novo".
- Acessibilidade: rótulos em todos os campos, `aria-invalid`, regiões `aria-live`, foco no primeiro erro, link "Ir para o conteúdo".
