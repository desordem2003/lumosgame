-- client/client.lua
-- Lógica do lado do cliente: gerencia a abertura/fechamento da NUI,
-- registra comandos de chat, processa eventos do servidor e do modo duelo.

local nuiAberta  = false   -- Controla se a interface está visível
local codigoSala = nil     -- Código da sala de duelo atual (nil = modo solo)
local eDono      = false   -- Se este jogador é o dono da sala

-- ============================================================
-- UTILITÁRIO: AbertarNUI
-- ============================================================
local function AbrirNUI(acao, dados)
    nuiAberta = true
    SetNuiFocus(true, true)
    local msg = { action = acao }
    if dados then
        for k, v in pairs(dados) do msg[k] = v end
    end
    SendNUIMessage(msg)
end

local function FecharNUI()
    nuiAberta  = false
    codigoSala = nil
    eDono      = false
    SetNuiFocus(false, false)
end

-- ============================================================
-- COMANDO: /termo
-- Abre o jogo SOLO.
-- ============================================================
RegisterCommand('termo', function()
    if nuiAberta then return end
    AbrirNUI("abrirJogo")
    TriggerServerEvent('lumos_termo:SolicitarPalavra')
    TriggerEvent('chat:addMessage', {
        color = {218, 165, 32}, multiline = true,
        args = {"Lumos Termo", Config.Mensagens.AbrirJogo}
    })
end, false)

-- ============================================================
-- COMANDO: /lumos_admin
-- Abre painel administrativo.
-- ============================================================
RegisterCommand('lumos_admin', function()
    if nuiAberta then return end
    AbrirNUI("abrirAdmin")
    TriggerServerEvent('lumos_termo:AdminListarPalavras')
end, false)

-- ============================================================
-- COMANDO: /termo_duelo [codigo?]
-- Sem código → cria nova sala de duelo (modo Fácil por padrão).
-- Com código → entra em sala existente.
-- ============================================================
RegisterCommand('termo_duelo', function(source, args)
    if nuiAberta then return end

    if args and args[1] and #args[1] == 4 then
        -- Entrar em sala existente
        local codigo = string.upper(args[1])
        AbrirNUI("abrirLobbyDuelo", { entrando = true, codigo = codigo })
        TriggerServerEvent('lumos_termo:EntrarSala', codigo)
    else
        -- Criar nova sala — mostra tela de criação na NUI
        AbrirNUI("abrirCriarSala")
    end
end, false)

-- ============================================================
-- CALLBACKS NUI — SOLO
-- ============================================================
RegisterNUICallback('fecharJogo', function(data, cb)
    -- Se estiver em duelo, avisa servidor antes de sair
    if codigoSala then
        TriggerServerEvent('lumos_termo:DesistirDuelo', codigoSala)
    end
    FecharNUI()
    cb("ok")
end)

RegisterNUICallback('enviarTentativa', function(data, cb)
    TriggerServerEvent('lumos_termo:ValidarTentativa', data.palavra)
    cb("ok")
end)

RegisterNUICallback('reiniciarJogo', function(data, cb)
    TriggerServerEvent('lumos_termo:SolicitarPalavra')
    cb("ok")
end)

RegisterNUICallback('revelarPalavra', function(data, cb)
    TriggerServerEvent('lumos_termo:RevelarPalavra')
    cb("ok")
end)

-- ============================================================
-- CALLBACKS NUI — DUELO
-- ============================================================

-- Jogador escolheu modo e quer criar sala
RegisterNUICallback('criarSala', function(data, cb)
    local modo = data.modo or "facil"
    TriggerServerEvent('lumos_termo:CriarSala', modo)
    cb("ok")
end)

-- Jogador confirmou entrada numa sala
RegisterNUICallback('entrarSala', function(data, cb)
    local codigo = string.upper(data.codigo or "")
    TriggerServerEvent('lumos_termo:EntrarSala', codigo)
    cb("ok")
end)

-- Dono inicia o duelo
RegisterNUICallback('iniciarDuelo', function(data, cb)
    if codigoSala then
        TriggerServerEvent('lumos_termo:IniciarDuelo', codigoSala)
    end
    cb("ok")
end)

-- Tentativa no modo duelo
RegisterNUICallback('enviarTentativaDuelo', function(data, cb)
    if codigoSala then
        TriggerServerEvent('lumos_termo:ValidarTentativaDuelo', codigoSala, data.palavra)
    end
    cb("ok")
end)

-- ============================================================
-- CALLBACKS NUI — ADMIN
-- ============================================================
RegisterNUICallback('adminAdicionarPalavra', function(data, cb)
    TriggerServerEvent('lumos_termo:AdminAdicionarPalavra', data.palavra)
    cb("ok")
end)

RegisterNUICallback('adminRemoverPalavra', function(data, cb)
    TriggerServerEvent('lumos_termo:AdminRemoverPalavra', data.palavra)
    cb("ok")
end)

RegisterNUICallback('adminSortearNova', function(data, cb)
    TriggerServerEvent('lumos_termo:AdminSortearNovaPalavra')
    cb("ok")
end)

-- ============================================================
-- EVENTOS DO SERVIDOR — SOLO
-- ============================================================
RegisterNetEvent('lumos_termo:ResultadoTentativa', function(resultado, status)
    SendNUIMessage({ action = "mostrarResultado", resultado = resultado, status = status })
end)

RegisterNetEvent('lumos_termo:ReceberTamanhoPalavra', function(tamanho)
    SendNUIMessage({ action = "configurarTabuleiro", tamanho = tamanho })
end)

RegisterNetEvent('lumos_termo:PalavraRevelada', function(palavra)
    SendNUIMessage({ action = "revelarPalavra", palavra = palavra })
end)

RegisterNetEvent('lumos_termo:ReceberListaPalavras', function(lista)
    SendNUIMessage({ action = "carregarListaAdmin", lista = lista })
end)

RegisterNetEvent('lumos_termo:AdminResposta', function(sucesso, mensagem)
    SendNUIMessage({ action = "adminNotificacao", sucesso = sucesso, mensagem = mensagem })
    if sucesso then TriggerServerEvent('lumos_termo:AdminListarPalavras') end
end)

-- ============================================================
-- EVENTOS DO SERVIDOR — DUELO
-- ============================================================

-- Sala criada com sucesso (este jogador é o dono)
RegisterNetEvent('lumos_termo:SalaCriada', function(codigo, modo)
    codigoSala = codigo
    eDono      = true
    SendNUIMessage({ action = "salaCriada", codigo = codigo, modo = modo })
end)

-- Entrou numa sala existente com sucesso
RegisterNetEvent('lumos_termo:EntrandoSala', function(codigo, modo, lista)
    codigoSala = codigo
    eDono      = false
    SendNUIMessage({ action = "entrandoSala", codigo = codigo, modo = modo, jogadores = lista })
end)

-- Atualização da lista de jogadores (novo entrante, alguém terminou etc.)
RegisterNetEvent('lumos_termo:AtualizarSala', function(lista, isDonoMsg)
    SendNUIMessage({ action = "atualizarSala", jogadores = lista, eDono = eDono })
end)

-- Este jogador foi promovido a dono
RegisterNetEvent('lumos_termo:VoceDono', function()
    eDono = true
    SendNUIMessage({ action = "promovido" })
end)

-- Erro ao entrar/criar sala
RegisterNetEvent('lumos_termo:ErroDuelo', function(msg)
    SendNUIMessage({ action = "erroDuelo", mensagem = msg })
    -- Fecha a NUI se estava na tela de lobby
    if nuiAberta then FecharNUI() end
end)

-- Duelo iniciado: todos recebem o tamanho da palavra
RegisterNetEvent('lumos_termo:DueloIniciado', function(codigo, tamanho, modo)
    codigoSala = codigo
    SendNUIMessage({ action = "dueloIniciado", tamanho = tamanho, modo = modo, codigo = codigo })
end)

-- Resultado de uma tentativa no duelo (apenas para este jogador)
RegisterNetEvent('lumos_termo:ResultadoTentativaDuelo', function(resultado, status, codigo)
    SendNUIMessage({ action = "resultadoDuelo", resultado = resultado, status = status })
end)

-- Palavra revelada ao perder no duelo
RegisterNetEvent('lumos_termo:PalavraReveladaDuelo', function(palavra)
    SendNUIMessage({ action = "revelarPalavraduelo", palavra = palavra })
end)

-- Placar final do duelo
RegisterNetEvent('lumos_termo:PlacarFinal', function(placar, palavra)
    codigoSala = nil
    eDono      = false
    SendNUIMessage({ action = "placarFinal", placar = placar, palavra = palavra })
end)