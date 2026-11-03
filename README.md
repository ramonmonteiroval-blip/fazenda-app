# Controle Fazenda (versão Firebase)

App de contas da fazenda entre Ramon e Vicente, dividido meio a meio.

- Login com Google, restrito a `ramonmonteiroval@gmail.com` e `vicentepmonteiro@gmail.com`.
- Lançamentos em tempo real (Firestore), visão mensal com navegação.
- Despesa: quem pagou. Receita: quem recebeu. Saldo "quem deve a quem" só considera o que já foi pago/recebido.
- Regras do Firestore liberam leitura e escrita só para os dois e-mails acima (ver `firestore.rules`).

Arquivos: `index.html` (interface), `logica.js` (cálculo de rateio, testável), `firestore.rules` (regras).
Testes da lógica: `node test/logica.test.mjs`.
