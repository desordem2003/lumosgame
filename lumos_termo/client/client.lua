-- client/client.lua
-- Lógica do lado do cliente: gerencia a abertura/fechamento da NUI,
-- registra comandos de chat e processa eventos vindos do servidor.

local nuiAberta = false   -- Controla se a interface está visível para evitar abertura dupla

-- ============================================================
-- COMANDO: /termo
-- Descrição: Abre o jogo para o jogador. Exibe a NUI e
-- bloqueia o controle do personagem enquanto o menu está aberto.
-- ============================================================
RegisterCommand('termo', function()
    if nuiAberta then return end

    nuiAberta = true
    SetNuiFocus(true, true)

    SendNUIMessage({ action = "abrirJogo" })

    -- Solicita o tamanho da palavra ao servidor para montar o tabuleiro
    TriggerServerEvent('lumos_termo:SolicitarPalavra')

    TriggerEvent('chat:addMessage', {
        color = {218, 165, 32},
        multiline = true,
        args = {"Lumos Termo", Config.Mensagens.AbrirJogo}
    })
end, false)

-- ============================================================
-- COMANDO: /lumos_admin
-- Descrição: Abre o painel administrativo para gerenciar
-- o banco de palavras. Apenas admins devem usar.
-- ============================================================
RegisterCommand('lumos_admin', function()
    if nuiAberta then return end

    nuiAberta = true
    SetNuiFocus(true, true)

    TriggerServerEvent('lumos_termo:AdminListarPalavras')
    SendNUIMessage({ action = "abrirAdmin" })
end, false)

-- ============================================================
-- CALLBACK NUI: fecharJogo
-- Descrição: Chamado pela interface quando o jogador fecha
-- o jogo (botão X ou tecla ESC). Restaura o controle.
-- ============================================================
RegisterNUICallback('fecharJogo', function(data, cb)
    nuiAberta = false
    SetNuiFocus(false, false)
    cb("ok")
end)

-- ============================================================
-- CALLBACK NUI: enviarTentativa
-- Descrição: Recebe a palavra digitada pelo jogador na
-- interface e envia ao servidor para validação.
-- ============================================================
RegisterNUICallback('enviarTentativa', function(data, cb)
    TriggerServerEvent('lumos_termo:ValidarTentativa', data.palavra)
    cb("ok")
end)

-- ============================================================
-- CALLBACK NUI: reiniciarJogo
-- Descrição: Solicita uma nova partida ao servidor, pedindo
-- o tamanho da palavra novamente para reconstruir o tabuleiro.
-- ============================================================
RegisterNUICallback('reiniciarJogo', function(data, cb)
    TriggerServerEvent('lumos_termo:SolicitarPalavra')
    cb("ok")
end)

-- ============================================================
-- CALLBACK NUI: revelarPalavra
-- Descrição: Pede ao servidor a palavra correta quando o
-- jogador perde (esgotou as tentativas).
-- ============================================================
RegisterNUICallback('revelarPalavra', function(data, cb)
    TriggerServerEvent('lumos_termo:RevelarPalavra')
    cb("ok")
end)

-- ============================================================
-- CALLBACK NUI: adminAdicionarPalavra
-- Descrição: Recebe do painel admin uma nova palavra para
-- adicionar e encaminha ao servidor.
-- ============================================================
RegisterNUICallback('adminAdicionarPalavra', function(data, cb)
    TriggerServerEvent('lumos_termo:AdminAdicionarPalavra', data.palavra)
    cb("ok")
end)

-- ============================================================
-- CALLBACK NUI: adminRemoverPalavra
-- Descrição: Recebe do painel admin uma palavra para remover
-- e encaminha ao servidor para deleção.
-- ============================================================
RegisterNUICallback('adminRemoverPalavra', function(data, cb)
    TriggerServerEvent('lumos_termo:AdminRemoverPalavra', data.palavra)
    cb("ok")
end)

-- ============================================================
-- CALLBACK NUI: adminSortearNova
-- Descrição: Admin solicita um novo sorteio de palavra
-- manualmente, sem precisar reiniciar o recurso.
-- ============================================================
RegisterNUICallback('adminSortearNova', function(data, cb)
    TriggerServerEvent('lumos_termo:AdminSortearNovaPalavra')
    cb("ok")
end)

-- ============================================================
-- EVENTO: lumos_termo:ResultadoTentativa
-- Descrição: Recebe o resultado da validação do servidor
-- e repassa à interface NUI para atualizar o tabuleiro.
-- ============================================================
RegisterNetEvent('lumos_termo:ResultadoTentativa', function(resultado, status)
    SendNUIMessage({
        action    = "mostrarResultado",
        resultado = resultado,
        status    = status
    })
end)

-- ============================================================
-- EVENTO: lumos_termo:ReceberTamanhoPalavra
-- Descrição: Recebe o número de letras da palavra atual
-- para configurar o tabuleiro corretamente.
-- ============================================================
RegisterNetEvent('lumos_termo:ReceberTamanhoPalavra', function(tamanho)
    SendNUIMessage({
        action  = "configurarTabuleiro",
        tamanho = tamanho
    })
end)

-- ============================================================
-- EVENTO: lumos_termo:PalavraRevelada
-- Descrição: Recebe a palavra correta após uma derrota e
-- envia à NUI para exibir na tela de fim de jogo.
-- ============================================================
RegisterNetEvent('lumos_termo:PalavraRevelada', function(palavra)
    SendNUIMessage({
        action  = "revelarPalavra",
        palavra = palavra
    })
end)

-- ============================================================
-- EVENTO: lumos_termo:ReceberListaPalavras
-- Descrição: Recebe a lista completa de palavras e
-- envia para o painel admin renderizar a tabela.
-- ============================================================
RegisterNetEvent('lumos_termo:ReceberListaPalavras', function(lista)
    SendNUIMessage({
        action = "carregarListaAdmin",
        lista  = lista
    })
end)

-- ============================================================
-- EVENTO: lumos_termo:AdminResposta
-- Descrição: Recebe feedback do servidor sobre ações do
-- admin (sucesso ou erro) e exibe notificação na NUI.
-- ============================================================
RegisterNetEvent('lumos_termo:AdminResposta', function(sucesso, mensagem)
    SendNUIMessage({
        action   = "adminNotificacao",
        sucesso  = sucesso,
        mensagem = mensagem
    })

    if sucesso then
        TriggerServerEvent('lumos_termo:AdminListarPalavras')
    end
end)