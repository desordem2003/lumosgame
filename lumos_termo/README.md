# Lumos Termo (FiveM)

Jogo de adivinhação de palavras estilo Termo/Wordle com tema Harry Potter,
integrado ao FiveM (CitizenFX), com painel administrativo para gerenciar o
banco de palavras.

## Instalação

1. Copie a pasta `lumos_termo/` para o diretório `resources/` do seu servidor FiveM.
2. No `server.cfg`, adicione:
   ```
   ensure lumos_termo
   ```
3. Configure as permissões de admin (veja `server.cfg.exemplo`).
4. Reinicie o servidor ou rode: `restart lumos_termo`

## Comandos

- `/termo` → Abre o jogo para qualquer jogador.
- `/lumos_admin` → Abre o painel admin (requer permissão `lumos_termo.admin`).

## Estrutura

```
lumos_termo/
├── fxmanifest.lua
├── config.lua
├── server/server.lua
├── client/client.lua
├── nui/{index.html, admin.html, style.css, script.js}
└── data/palavras.json
```

## Segurança

- A palavra sorteada nunca é enviada ao cliente durante a partida; só o tamanho.
- A palavra correta só é revelada após a derrota (todas as tentativas esgotadas).
- Toda ação de admin é validada por `IsPlayerAceAllowed` no servidor.

## Observações

- `Config.TamanhoPalavra` define o tamanho das palavras sorteadas (padrão 5).
  Apenas palavras com esse número de caracteres entram no sorteio.
- O banco de palavras é editável em tempo real pelo painel admin, sem reiniciar.