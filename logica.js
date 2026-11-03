// Lógica pura do Controle Fazenda (sem Firebase), testável no Node.
// Regra: tudo é dividido meio a meio entre os dois sócios.
// Despesa: quem pagou tem a metade do valor a receber do outro.
// Receita: quem recebeu tem a metade do valor a repassar ao outro.

export const SOCIOS = {
  'ramonmonteiroval@gmail.com': 'Ramon',
  'vicentepmonteiro@gmail.com': 'Vicente',
};
export const NOMES = ['Ramon', 'Vicente'];

export const CATEGORIAS = [
  'Aquisição de animais', 'Pessoal e encargos', 'Ração', 'Medicamentos',
  'Ferramentas', 'Manutenção de máquinas', 'Adubos', 'Sementes', 'Energia',
  'Internet', 'Frete', 'Combustível', 'Locação de máquinas', 'Impostos e taxas',
  'Venda de gado', 'Aluguel de pastagem', 'Outros',
];

// Converte valor em centavos (inteiro) para evitar erro de ponto flutuante.
export function paraCentavos(valor) {
  return Math.round(Number(valor) * 100);
}

// Saldo de cada sócio em centavos. Positivo = o outro sócio deve a ele.
// lancamentos: [{tipo:'despesa'|'receita', valor (centavos), quem:'Ramon'|'Vicente', situacao}]
// Só entra no saldo o que está 'realizado' (já pago/recebido).
export function calcularSaldo(lancamentos) {
  const saldo = { Ramon: 0, Vicente: 0 };
  for (const l of lancamentos) {
    if (l.situacao !== 'realizado') continue;
    const metade = Math.round(l.valor / 2);
    const sinal = l.tipo === 'despesa' ? 1 : -1;
    const outro = l.quem === 'Ramon' ? 'Vicente' : 'Ramon';
    // quem pagou (despesa) recebe metade do outro; quem recebeu (receita) deve metade ao outro
    saldo[l.quem] += sinal * metade;
    saldo[outro] -= sinal * metade;
  }
  return saldo;
}

// Frase "quem deve a quem" a partir do saldo.
export function quemDeveAQuem(saldo) {
  const r = saldo.Ramon;
  if (r === 0) return 'Contas zeradas: ninguém deve a ninguém.';
  // saldo positivo para um = o outro deve a ele
  const devedor = r > 0 ? 'Vicente' : 'Ramon';
  const credor = r > 0 ? 'Ramon' : 'Vicente';
  return `${devedor} deve a ${credor}: ${formatarBRL(Math.abs(r))}`;
}

export function formatarBRL(centavos) {
  return (centavos / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Filtra lançamentos pelo mês 'YYYY-MM'.
export function doMes(lancamentos, ym) {
  return lancamentos.filter((l) => l.data && l.data.slice(0, 7) === ym);
}

export function mesAtual(hoje = new Date()) {
  const m = String(hoje.getMonth() + 1).padStart(2, '0');
  return `${hoje.getFullYear()}-${m}`;
}

export function mudaMes(ym, delta) {
  const [a, m] = ym.split('-').map(Number);
  const d = new Date(a, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

// Totais do mês: receitas, despesas e resultado (em centavos).
export function totaisMes(lancamentos) {
  let receitas = 0, despesas = 0;
  for (const l of lancamentos) {
    if (l.tipo === 'receita') receitas += l.valor; else despesas += l.valor;
  }
  return { receitas, despesas, resultado: receitas - despesas };
}

// Converte texto digitado ("1.234,56") em centavos.
export function parseMoeda(texto) {
  const limpo = String(texto).replace(/\./g, '').replace(',', '.').replace(/[^\d.]/g, '');
  const n = parseFloat(limpo);
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
}
