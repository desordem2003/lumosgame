-- fxmanifest.lua
-- Define o manifesto do recurso para o FiveM reconhecer e carregar os arquivos corretamente

fx_version 'cerulean'       -- Versão do framework FiveM
game 'gta5'                 -- Jogo alvo

author 'Lumos RP'
description 'Lumos Termo - Jogo de palavras estilo Wordle com tema Harry Potter'
version '1.0.0'

-- Arquivos Lua que rodam no lado do servidor
server_scripts {
    'config.lua',
    'server/server.lua'
}

-- Arquivos Lua que rodam no lado do cliente
client_scripts {
    'config.lua',
    'client/client.lua'
}

-- Arquivos NUI (interface HTML exibida ao jogador)
ui_page 'nui/index.html'

files {
    'nui/index.html',
    'nui/admin.html',
    'nui/style.css',
    'nui/script.js',
    'data/palavras.json'
}