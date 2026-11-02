// Servidor das Contas da Fazenda. Sem dependências externas (Node 18+).
// Variáveis de ambiente:
//   PORT        porta HTTP (padrão 3000)
//   APP_TOKEN   código de acesso que vocês dois digitam no app (obrigatório)
//   DATA_FILE   arquivo onde os lançamentos são guardados (padrão ./data/lancamentos.json)
const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = Number(process.env.PORT || 3000);
const TOKEN = process.env.APP_TOKEN || "";
const DATA_FILE = process.env.DATA_FILE || path.join(__dirname, "data", "lancamentos.json");
const PUBLIC = path.join(__dirname, "public");

if (!TOKEN) {
  console.error("Defina APP_TOKEN antes de iniciar.");
  process.exit(1);
}

// Estado em memória, gravado em disco a cada alteração (escrita atômica).
let store = { lancamentos: {} }; // id -> { ...campos, atualizado, excluido }

function carregar() {
  try {
    store = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  } catch (e) {
    store = { lancamentos: {} };
  }
}

function salvar() {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  const tmp = DATA_FILE + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(store));
  fs.renameSync(tmp, DATA_FILE);
}

carregar();

function json(res, code, obj) {
  res.writeHead(code, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  res.end(JSON.stringify(obj));
}

function autorizado(req) {
  return req.headers["x-app-token"] === TOKEN;
}

function lerCorpo(req) {
  return new Promise((resolve, reject) => {
    let t = "";
    req.on("data", (c) => {
      t += c;
      if (t.length > 1e6) reject(new Error("corpo grande demais"));
    });
    req.on("end", () => {
      try { resolve(t ? JSON.parse(t) : {}); } catch (e) { reject(e); }
    });
    req.on("error", reject);
  });
}

// Regra de conflito: vence quem tem a alteração mais recente (campo "atualizado").
function aplicar(id, dados) {
  const atual = store.lancamentos[id];
  if (atual && atual.atualizado && dados.atualizado && dados.atualizado < atual.atualizado) {
    return atual; // alteração antiga: ignora e devolve o estado atual
  }
  store.lancamentos[id] = Object.assign({}, atual || {}, dados, { id });
  return store.lancamentos[id];
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://x");

  if (url.pathname === "/api/health") return json(res, 200, { ok: true });

  if (url.pathname.startsWith("/api/")) {
    if (!autorizado(req)) return json(res, 401, { erro: "codigo_invalido" });

    if (url.pathname === "/api/lancamentos" && req.method === "GET") {
      const lista = Object.values(store.lancamentos).filter((r) => !r.excluido);
      return json(res, 200, { lancamentos: lista, geradoEm: new Date().toISOString() });
    }

    const m = url.pathname.match(/^\/api\/lancamentos\/([A-Za-z0-9_-]{1,80})$/);
    if (m) {
      const id = m[1];
      try {
        if (req.method === "PUT" || req.method === "PATCH") {
          const dados = await lerCorpo(req);
          const salvo = aplicar(id, dados);
          salvar();
          return json(res, 200, salvo);
        }
        if (req.method === "DELETE") {
          const agora = new Date().toISOString();
          aplicar(id, { excluido: true, atualizado: agora });
          salvar();
          return json(res, 200, { ok: true });
        }
      } catch (e) {
        return json(res, 400, { erro: "dados_invalidos" });
      }
    }
    return json(res, 404, { erro: "nao_encontrado" });
  }

  // Arquivos do app (HTML, service worker, manifest, ícone).
  const arq = path.join(PUBLIC, url.pathname === "/" ? "index.html" : url.pathname);
  if (!arq.startsWith(PUBLIC)) { res.writeHead(403); return res.end(); }
  fs.readFile(arq, (err, conteudo) => {
    if (err) { res.writeHead(404); return res.end("nao encontrado"); }
    const tipos = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8",
      ".json": "application/manifest+json", ".webmanifest": "application/manifest+json",
      ".svg": "image/svg+xml", ".png": "image/png" };
    res.writeHead(200, { "Content-Type": tipos[path.extname(arq)] || "application/octet-stream", "Cache-Control": "no-cache" });
    res.end(conteudo);
  });
});

server.listen(PORT, () => console.log("Contas da Fazenda rodando na porta " + PORT));
