-- server/server.lua
-- Lógica do lado do servidor: gerencia o banco de palavras, sorteia a palavra do dia,
-- valida entradas, controla o painel administrativo e o modo multiplayer Duelo Bruxo.

local palavras = {}       -- Tabela que armazena todas as palavras carregadas em memória
local palavraAtual = ""   -- Palavra sorteada atualmente para o jogo solo

-- ── SALAS DE DUELO ────────────────────────────────────────────────────────────
-- Estrutura de cada sala:
-- Salas[codigo] = {
--   dono      = source (ID do criador),
--   modo      = "facil" | "medio" | "dificil",
--   jogadores = { [source] = { nome, steamId, tentativas, status } },
--   palavra   = string (vazia até iniciar),
--   ativa     = bool,
--   timer     = thread de timeout
-- }
local Salas = {}

-- ============================================================
-- UTILITÁRIO: TrimString
-- ============================================================
local function TrimString(s)
    if type(s) ~= "string" then return "" end
    return s:match("^%s*(.-)%s*$")
end

-- ============================================================
-- UTILITÁRIO: GerarCodigo
-- Gera um código único de 4 letras maiúsculas para a sala.
-- ============================================================
local function GerarCodigo()
    local chars = "ABCDEFGHJKLMNPQRSTUVWXYZ"
    local code
    repeat
        code = ""
        for _ = 1, 4 do
            local i = math.random(1, #chars)
            code = code .. chars:sub(i, i)
        end
    until not Salas[code]
    return code
end

-- ============================================================
-- UTILITÁRIO: ObterNomeJogador
-- ============================================================
local function ObterNomeJogador(src)
    return GetPlayerName(src) or ("Bruxo #" .. src)
end

-- ============================================================
-- UTILITÁRIO: ObterSteamId
-- ============================================================
local function ObterSteamId(src)
    return GetPlayerIdentifier(src, "steam") or ("player:" .. src)
end

-- ============================================================
-- UTILITÁRIO: ListaJogadoresSala
-- Retorna lista simplificada para enviar à NUI.
-- ============================================================
local function ListaJogadoresSala(sala)
    local lista = {}
    for srcId, dados in pairs(sala.jogadores) do
        table.insert(lista, {
            id       = srcId,
            nome     = dados.nome,
            status   = dados.status,       -- "aguardando" | "jogando" | "ganhou" | "perdeu" | "desistiu"
            tentativas = dados.tentativas  -- quantas tentativas usou (nil se ainda não terminou)
        })
    end
    return lista
end

-- ============================================================
-- UTILITÁRIO: BroadcastSala
-- Envia um evento para todos os jogadores de uma sala.
-- ============================================================
local function BroadcastSala(sala, evento, ...)
    for srcId, _ in pairs(sala.jogadores) do
        TriggerClientEvent(evento, srcId, ...)
    end
end

-- ============================================================
-- UTILITÁRIO: VerificarFimDuelo
-- Verifica se todos os jogadores terminaram. Se sim, mostra placar.
-- ============================================================
local function VerificarFimDuelo(codigo)
    local sala = Salas[codigo]
    if not sala or not sala.ativa then return end

    local todos = true
    for _, dados in pairs(sala.jogadores) do
        if dados.status == "jogando" then
            todos = false
            break
        end
    end

    if todos then
        sala.ativa = false
        -- Cancela timer de timeout, se houver
        if sala.timer then
            sala.timer = nil
        end
        local placar = ListaJogadoresSala(sala)
        BroadcastSala(sala, "lumos_termo:PlacarFinal", placar, sala.palavra)
        -- Limpa a sala após 30 segundos
        SetTimeout(30000, function()
            Salas[codigo] = nil
        end)
    end
end

-- ============================================================
-- UTILITÁRIO: SortearPalavraModo
-- Sorteia uma palavra do banco compatível com o modo.
-- ============================================================
local function SortearPalavraModo(modo)
    local filtradas = {}
    for _, p in ipairs(palavras) do
        local tam = #p
        if modo == "facil"   and tam == 5 then table.insert(filtradas, p)
        elseif modo == "medio"   and (tam == 6 or tam == 7) then table.insert(filtradas, p)
        elseif modo == "dificil" and tam >= 8 then table.insert(filtradas, p)
        end
    end
    if #filtradas == 0 then
        -- fallback: qualquer palavra com tamanho padrão
        for _, p in ipairs(palavras) do
            if #p == Config.TamanhoPalavra then table.insert(filtradas, p) end
        end
    end
    if #filtradas == 0 then return "LUMOS" end
    return string.upper(filtradas[math.random(#filtradas)])
end

-- ============================================================
-- FUNÇÃO: CarregarPalavras
-- ============================================================
local function CarregarPalavras()
    local arquivo = LoadResourceFile(GetCurrentResourceName(), "data/palavras.json")
    if arquivo then
        local dados = json.decode(arquivo)
        if dados and type(dados) == "table" then
            palavras = dados
            if Config.Debug then
                print("[Lumos Termo] " .. #palavras .. " palavras carregadas.")
            end
        end
    else
        print("[Lumos Termo] ERRO: Arquivo palavras.json não encontrado!")
    end
end

-- ============================================================
-- FUNÇÃO: SalvarPalavras
-- ============================================================
local function SalvarPalavras()
    local conteudo = json.encode(palavras, { indent = true })
    SaveResourceFile(GetCurrentResourceName(), "data/palavras.json", conteudo, -1)
end

-- ============================================================
-- FUNÇÃO: SortearPalavra (solo)
-- ============================================================
local function SortearPalavra()
    local validas = {}
    for _, p in ipairs(palavras) do
        if #p == Config.TamanhoPalavra then
            table.insert(validas, p)
        end
    end
    if #validas == 0 then
        print("[Lumos Termo] AVISO: Nenhuma palavra com " .. Config.TamanhoPalavra .. " letras!")
        return
    end
    math.randomseed(os.time())
    palavraAtual = string.upper(validas[math.random(#validas)])
    if Config.Debug then print("[Lumos Termo] Palavra sorteada: " .. palavraAtual) end
end

-- ============================================================
-- EVENTO: Inicialização
-- ============================================================
AddEventHandler('onResourceStart', function(resourceName)
    if resourceName == GetCurrentResourceName() then
        math.randomseed(os.time())
        CarregarPalavras()
        SortearPalavra()
    end
end)

-- ============================================================
-- EVENTO: Quando jogador desconecta — remove de salas abertas
-- ============================================================
AddEventHandler('playerDropped', function(reason)
    local src = source
    for codigo, sala in pairs(Salas) do
        if sala.jogadores[src] then
            sala.jogadores[src].status = "desistiu"
            local lista = ListaJogadoresSala(sala)
            BroadcastSala(sala, "lumos_termo:AtualizarSala", lista)
            -- Se era o dono, promover próximo ou encerrar
            if sala.dono == src then
                local proximo = nil
                for sid, _ in pairs(sala.jogadores) do
                    if sid ~= src then proximo = sid; break end
                end
                if proximo then
                    sala.dono = proximo
                    TriggerClientEvent('lumos_termo:VoceDono', proximo)
                else
                    Salas[codigo] = nil
                end
            end
            VerificarFimDuelo(codigo)
        end
    end
end)

-- ============================================================
-- CALLBACKS SOLO
-- ============================================================
RegisterNetEvent('lumos_termo:SolicitarPalavra', function()
    local src = source
    TriggerClientEvent('lumos_termo:ReceberTamanhoPalavra', src, #palavraAtual)
end)

RegisterNetEvent('lumos_termo:ValidarTentativa', function(tentativa)
    local src = source
    tentativa = string.upper(TrimString(tentativa))
    local existe = false
    for _, p in ipairs(palavras) do
        if string.upper(p) == tentativa then existe = true; break end
    end
    if not existe then
        TriggerClientEvent('lumos_termo:ResultadoTentativa', src, nil, "invalida")
        return
    end
    local resultado = {}
    local letrasRestantes = {}
    for i = 1, #palavraAtual do letrasRestantes[i] = string.sub(palavraAtual, i, i) end

    for i = 1, #tentativa do
        if string.sub(tentativa, i, i) == string.sub(palavraAtual, i, i) then
            resultado[i] = "correto"
            letrasRestantes[i] = ""
        else
            resultado[i] = "ausente"
        end
    end
    for i = 1, #tentativa do
        if resultado[i] ~= "correto" then
            local letra = string.sub(tentativa, i, i)
            for j, l in ipairs(letrasRestantes) do
                if l == letra then
                    resultado[i] = "presente"
                    letrasRestantes[j] = ""
                    break
                end
            end
        end
    end

    local ganhou = (tentativa == palavraAtual)
    TriggerClientEvent('lumos_termo:ResultadoTentativa', src, resultado, ganhou and "ganhou" or "continua")
end)

RegisterNetEvent('lumos_termo:RevelarPalavra', function()
    local src = source
    TriggerClientEvent('lumos_termo:PalavraRevelada', src, palavraAtual)
end)

-- ============================================================
-- ── DUELO BRUXO ───────────────────────────────────────────
-- ============================================================

-- Criar sala de duelo
RegisterNetEvent('lumos_termo:CriarSala', function(modo)
    local src = source
    modo = (modo == "facil" or modo == "medio" or modo == "dificil") and modo or "facil"

    local codigo = GerarCodigo()
    Salas[codigo] = {
        dono      = src,
        modo      = modo,
        jogadores = {
            [src] = {
                nome       = ObterNomeJogador(src),
                steamId    = ObterSteamId(src),
                status     = "aguardando",
                tentativas = nil,
                resultado  = nil,
            }
        },
        palavra   = "",
        ativa     = false,
    }

    TriggerClientEvent('lumos_termo:SalaCriada', src, codigo, modo)
    TriggerClientEvent('lumos_termo:AtualizarSala', src, ListaJogadoresSala(Salas[codigo]), true)

    TriggerEvent('chat:addMessage', src, {
        color = {218, 165, 32}, args = {"Lumos Duelo", Config.Mensagens.DueloCriado .. " Código: " .. codigo}
    })
    if Config.Debug then print("[Lumos Duelo] Sala criada: " .. codigo .. " por " .. ObterNomeJogador(src)) end
end)

-- Entrar em sala existente
RegisterNetEvent('lumos_termo:EntrarSala', function(codigo)
    local src = source
    codigo = string.upper(TrimString(codigo))

    local sala = Salas[codigo]
    if not sala then
        TriggerClientEvent('lumos_termo:ErroDuelo', src, Config.Mensagens.DueloInvalid)
        return
    end
    if sala.ativa then
        TriggerClientEvent('lumos_termo:ErroDuelo', src, "Este duelo já começou!")
        return
    end

    local qtd = 0
    for _ in pairs(sala.jogadores) do qtd = qtd + 1 end
    if qtd >= Config.MaxJogadoresSala then
        TriggerClientEvent('lumos_termo:ErroDuelo', src, Config.Mensagens.DueloLleno)
        return
    end

    sala.jogadores[src] = {
        nome       = ObterNomeJogador(src),
        steamId    = ObterSteamId(src),
        status     = "aguardando",
        tentativas = nil,
        resultado  = nil,
    }

    local lista = ListaJogadoresSala(sala)
    -- Notifica todos na sala sobre o novo jogador
    BroadcastSala(sala, "lumos_termo:AtualizarSala", lista, false)
    -- O novo jogador recebe confirmação e sabe que NÃO é dono
    TriggerClientEvent('lumos_termo:EntrandoSala', src, codigo, sala.modo, lista)

    if Config.Debug then print("[Lumos Duelo] " .. ObterNomeJogador(src) .. " entrou na sala " .. codigo) end
end)

-- Iniciar duelo (apenas o dono pode)
RegisterNetEvent('lumos_termo:IniciarDuelo', function(codigo)
    local src = source
    local sala = Salas[codigo]

    if not sala then TriggerClientEvent('lumos_termo:ErroDuelo', src, "Sala não encontrada!"); return end
    if sala.dono ~= src then TriggerClientEvent('lumos_termo:ErroDuelo', src, "Apenas o dono pode iniciar!"); return end

    local qtd = 0
    for _ in pairs(sala.jogadores) do qtd = qtd + 1 end
    if qtd < 2 then
        TriggerClientEvent('lumos_termo:ErroDuelo', src, "É necessário pelo menos 2 jogadores para iniciar!")
        return
    end

    sala.palavra = SortearPalavraModo(sala.modo)
    sala.ativa   = true

    -- Marca todos como "jogando"
    for sid, _ in pairs(sala.jogadores) do
        sala.jogadores[sid].status = "jogando"
        sala.jogadores[sid].tentativas = 0
    end

    -- Envia o tamanho da palavra (nunca a palavra em si!) para todos
    BroadcastSala(sala, "lumos_termo:DueloIniciado", codigo, #sala.palavra, sala.modo)

    -- Timer de timeout
    SetTimeout(Config.TimeoutDuelo * 1000, function()
        if Salas[codigo] and Salas[codigo].ativa then
            -- Marca quem ainda está jogando como desistiu
            for sid, dados in pairs(Salas[codigo].jogadores) do
                if dados.status == "jogando" then
                    Salas[codigo].jogadores[sid].status = "desistiu"
                end
            end
            Salas[codigo].ativa = false
            local placar = ListaJogadoresSala(Salas[codigo])
            BroadcastSala(Salas[codigo], "lumos_termo:PlacarFinal", placar, Salas[codigo].palavra)
            SetTimeout(30000, function() Salas[codigo] = nil end)
        end
    end)

    if Config.Debug then print("[Lumos Duelo] Duelo iniciado na sala " .. codigo .. " — Palavra: " .. sala.palavra) end
end)

-- Validar tentativa no modo duelo
RegisterNetEvent('lumos_termo:ValidarTentativaDuelo', function(codigo, tentativa)
    local src = source
    local sala = Salas[codigo]
    if not sala or not sala.ativa then return end
    if not sala.jogadores[src] or sala.jogadores[src].status ~= "jogando" then return end

    tentativa = string.upper(TrimString(tentativa))
    local palavra = sala.palavra

    -- Valida se existe no banco
    local existe = false
    for _, p in ipairs(palavras) do
        if string.upper(p) == tentativa then existe = true; break end
    end
    -- No modo dificil aceita qualquer sequência válida para não penalizar demais
    if sala.modo ~= "dificil" and not existe then
        TriggerClientEvent('lumos_termo:ResultadoTentativaDuelo', src, nil, "invalida", codigo)
        return
    end

    -- Comparação letra por letra (algoritmo correto para letras repetidas)
    local resultado  = {}
    local letrasRest = {}
    for i = 1, #palavra do letrasRest[i] = string.sub(palavra, i, i) end

    for i = 1, #tentativa do
        if string.sub(tentativa, i, i) == string.sub(palavra, i, i) then
            resultado[i] = "correto"; letrasRest[i] = ""
        else resultado[i] = "ausente" end
    end
    for i = 1, #tentativa do
        if resultado[i] ~= "correto" then
            local letra = string.sub(tentativa, i, i)
            for j, l in ipairs(letrasRest) do
                if l == letra then resultado[i] = "presente"; letrasRest[j] = ""; break end
            end
        end
    end

    sala.jogadores[src].tentativas = sala.jogadores[src].tentativas + 1
    local numTentativa = sala.jogadores[src].tentativas
    local ganhou = (tentativa == palavra)
    local status = ganhou and "ganhou" or "continua"

    if ganhou then
        sala.jogadores[src].status = "ganhou"
    elseif numTentativa >= Config.MaxTentativas then
        sala.jogadores[src].status = "perdeu"
        status = "esgotou"
    end

    -- Envia resultado apenas para o jogador que tentou
    TriggerClientEvent('lumos_termo:ResultadoTentativaDuelo', src, resultado, status, codigo)

    -- Notifica todos na sala sobre atualização de status (sem revelar letras)
    if ganhou or status == "esgotou" then
        local lista = ListaJogadoresSala(sala)
        BroadcastSala(sala, "lumos_termo:AtualizarSala", lista, false)
        -- Revela palavra para quem perdeu
        if status == "esgotou" then
            TriggerClientEvent('lumos_termo:PalavraReveladaDuelo', src, palavra)
        end
        VerificarFimDuelo(codigo)
    end
end)

-- Jogador desiste manualmente do duelo
RegisterNetEvent('lumos_termo:DesistirDuelo', function(codigo)
    local src = source
    local sala = Salas[codigo]
    if not sala then return end
    if sala.jogadores[src] then
        sala.jogadores[src].status = "desistiu"
        local lista = ListaJogadoresSala(sala)
        BroadcastSala(sala, "lumos_termo:AtualizarSala", lista, false)
        VerificarFimDuelo(codigo)
    end
end)

-- ============================================================
-- ADMIN — CALLBACKS
-- ============================================================
RegisterNetEvent('lumos_termo:AdminAdicionarPalavra', function(palavra)
    local src = source
    if not IsPlayerAceAllowed(src, "lumos_termo.admin") then
        TriggerClientEvent('lumos_termo:AdminResposta', src, false, Config.Mensagens.SemPermissao)
        return
    end
    palavra = string.lower(TrimString(palavra))
    if palavra == "" then
        TriggerClientEvent('lumos_termo:AdminResposta', src, false, "Palavra inválida!")
        return
    end
    for _, p in ipairs(palavras) do
        if p == palavra then
            TriggerClientEvent('lumos_termo:AdminResposta', src, false, "Palavra já existe no Grimório!")
            return
        end
    end
    table.insert(palavras, palavra)
    SalvarPalavras()
    TriggerClientEvent('lumos_termo:AdminResposta', src, true, Config.Mensagens.PalavraAdded)
end)

RegisterNetEvent('lumos_termo:AdminRemoverPalavra', function(palavra)
    local src = source
    if not IsPlayerAceAllowed(src, "lumos_termo.admin") then
        TriggerClientEvent('lumos_termo:AdminResposta', src, false, Config.Mensagens.SemPermissao)
        return
    end
    palavra = string.lower(TrimString(palavra))
    local index = nil
    for i, p in ipairs(palavras) do
        if p == palavra then index = i; break end
    end
    if not index then
        TriggerClientEvent('lumos_termo:AdminResposta', src, false, "Palavra não encontrada no Grimório!")
        return
    end
    table.remove(palavras, index)
    SalvarPalavras()
    if string.upper(palavra) == palavraAtual then SortearPalavra() end
    TriggerClientEvent('lumos_termo:AdminResposta', src, true, Config.Mensagens.PalavraRemov)
end)

RegisterNetEvent('lumos_termo:AdminListarPalavras', function()
    local src = source
    if not IsPlayerAceAllowed(src, "lumos_termo.admin") then return end
    TriggerClientEvent('lumos_termo:ReceberListaPalavras', src, palavras)
end)

RegisterNetEvent('lumos_termo:AdminSortearNovaPalavra', function()
    local src = source
    if not IsPlayerAceAllowed(src, "lumos_termo.admin") then return end
    SortearPalavra()
    TriggerClientEvent('lumos_termo:AdminResposta', src, true, "Nova palavra sorteada com sucesso!")
end)