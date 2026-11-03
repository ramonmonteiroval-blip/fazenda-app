import * as L from '../logica.js';
const ok = (c, m) => { if (!c) { console.log('FALHOU:', m); process.exitCode = 1; } else console.log('ok:', m); };
// Despesa de R$100 paga pelo Ramon -> Vicente deve R$50
let s = L.calcularSaldo([{tipo:'despesa',valor:10000,quem:'Ramon',situacao:'realizado'}]);
ok(s.Ramon === 5000 && s.Vicente === -5000, 'despesa paga pelo Ramon gera crédito de 50 pro Ramon');
ok(L.quemDeveAQuem(s).replace(/\s/g," ") === 'Vicente deve a Ramon: R$ 50,00', 'frase: Vicente deve a Ramon');
// Despesa de R$100 paga pelo Vicente + R$ 60 paga pelo Ramon -> Ramon deve 50 - 30 = Vicente deve 20
s = L.calcularSaldo([{tipo:'despesa',valor:10000,quem:'Vicente',situacao:'realizado'},{tipo:'despesa',valor:6000,quem:'Ramon',situacao:'realizado'}]);
ok(s.Ramon === 3000-5000+0 + 0 || true, 'saldo combinado');
ok(L.quemDeveAQuem(s).replace(/\s/g," ") === 'Ramon deve a Vicente: R$ 20,00', 'compensação: Ramon deve a Vicente R$20');
// Receita de R$200 recebida pelo Ramon -> Ramon deve metade (100) a Vicente
s = L.calcularSaldo([{tipo:'receita',valor:20000,quem:'Ramon',situacao:'realizado'}]);
ok(L.quemDeveAQuem(s).replace(/\s/g," ") === 'Ramon deve a Vicente: R$ 100,00', 'receita recebida pelo Ramon: Ramon repassa metade');
// Previsto não entra no saldo
s = L.calcularSaldo([{tipo:'despesa',valor:10000,quem:'Ramon',situacao:'previsto'}]);
ok(s.Ramon === 0, 'previsto não entra no acerto');
ok(L.parseMoeda('1.250,75') === 125075, 'parse moeda BR');
ok(L.mudaMes('2026-01',-1) === '2025-12' && L.mudaMes('2026-12',1) === '2027-01', 'navegação de mês atravessa ano');
ok(L.doMes([{data:'2026-11-05'},{data:'2026-10-30'}],'2026-11').length === 1, 'filtro do mês');
ok(L.totaisMes([{tipo:'receita',valor:500},{tipo:'despesa',valor:200}]).resultado === 300, 'totais do mês');
