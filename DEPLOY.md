# Contas da Fazenda: instalação no VPS

Este guia assume Ubuntu 22.04 ou 24.04 no VPS e um domínio apontado para o IP dele.

## 1. Preparar o VPS (uma vez)

```bash
sudo apt update && sudo apt install -y git curl
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
sudo apt install -y caddy
```

## 2. Baixar o código

Crie um repositório privado no GitHub (`fazenda-app`) e envie esta pasta. No VPS:

```bash
sudo mkdir -p /opt/fazenda && sudo chown $USER /opt/fazenda
git clone git@github.com:SEU_USUARIO/fazenda-app.git /opt/fazenda
```

Se o clone pedir chave, crie uma chave de deploy só para este repositório (`ssh-keygen -t ed25519`) e cadastre a parte pública em *Settings > Deploy keys* do repositório.

## 3. Criar o código de acesso e o serviço

Escolha um código que só vocês dois sabem. Depois:

```bash
sudo tee /etc/systemd/system/fazenda.service > /dev/null <<'EOF'
[Unit]
Description=Contas da Fazenda
After=network.target

[Service]
WorkingDirectory=/opt/fazenda
ExecStart=/usr/bin/node server.js
Environment=PORT=3000
Environment=APP_TOKEN=TROQUE_PELO_CODIGO
Environment=DATA_FILE=/opt/fazenda/data/lancamentos.json
Restart=always
User=root

[Install]
WantedBy=multi-user.target
EOF
sudo systemctl daemon-reload && sudo systemctl enable --now fazenda
```

Troque `TROQUE_PELO_CODIGO` pelo código escolhido. Confirme com `curl localhost:3000/api/health`.

## 4. HTTPS e domínio (Caddy)

```bash
sudo tee /etc/caddy/Caddyfile > /dev/null <<'EOF'
SEU_DOMINIO.COM.BR {
    reverse_proxy localhost:3000
}
EOF
sudo systemctl reload caddy
```

O Caddy emite o certificado HTTPS sozinho. Sem HTTPS o app não instala no celular.

## 5. Instalar no celular e no computador

- **Celular (Android/Chrome):** abra `https://SEU_DOMINIO.COM.BR`, toque em ⋮ e depois em *Instalar app*.
- **iPhone (Safari):** abra o endereço, toque em Compartilhar e depois em *Adicionar à Tela de Início*.
- **Computador (Chrome/Edge):** abra o endereço e clique no ícone de instalação na barra de endereço.

Na primeira abertura, digite o código de acesso. Ele fica salvo no aparelho.

## 6. Atualizar o app

Quando houver mudança no código, no VPS:

```bash
cd /opt/fazenda && git pull && sudo systemctl restart fazenda
```

Quem já tem o app instalado recebe a versão nova na próxima vez que abrir com internet.

## Backup

Copie `/opt/fazenda/data/lancamentos.json` periodicamente. É o arquivo com todos os lançamentos.
