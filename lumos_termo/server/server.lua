-- server/server.lua
-- Lógica do lado do servidor: gerencia o banco de palavras, sorteia a palavra do dia,
-- valida entradas e controla o painel administrativo com segurança.

local palavras = {}       -- Tabela que armazena todas as palavras carregadas em memória
local palavraAtual = ""   -- Palavra sorteada atualmente para o jogo

-- ============================================================
-- UTILITÁRIO: TrimString
-- Descrição: Remove espaços em branco do início e fim de
-- uma string. Evita erros por espaços acidentais na entrada.
-- ============================================================
local function TrimString(s)
    if type(s) ~= "string" then return "" end
    return s:match("^%s*(.-)%s*$")
end

-- ============================================================
-- FUNÇÃO: CarregarPalavras
-- Descrição: Lê o arquivo JSON com as palavras do jogo e
-- carrega na tabela 'palavras' em memória.
-- É chamada automaticamente ao iniciar o recurso.
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
-- Descrição: Serializa a tabela 'palavras' em JSON e salva
-- de volta no arquivo. Chamada sempre que uma palavra
-- é adicionada ou removida pelo admin.
-- ============================================================
local function SalvarPalavras()
    local conteudo = json.encode(palavras, { indent = true })
    SaveResourceFile(GetCurrentResourceName(), "data/palavras.json", conteudo, -1)
end

-- ============================================================
-- FUNÇÃO: SortearPalavra
-- Descrição: Escolhe aleatoriamente uma palavra da lista
-- para ser a palavra do dia. Garante que seja uma palavra
-- válida com o tamanho configurado.
-- ============================================================
local function SortearPalavra()
    local validas = {}
    for _, p in ipairs(palavras) do
        if #p == Config.TamanhoPalavra then
            table.insert(validas, p)
        end
    end

    if #validas == 0 then
        print("[Lumos Termo] AVISO: Nenhuma palavra com " .. Config.TamanhoPalavra .. " letras encontrada!")
        return
    end

    math.randomseed(os.time())
    palavraAtual = string.upper(validas[math.random(#validas)])

    if Config.Debug then
        print("[Lumos Termo] Palavra sorteada: " .. palavraAtual)
    end
end

-- ============================================================
-- EVENTO: Inicialização do Recurso
-- Descrição: Roda automaticamente quando o recurso é iniciado.
-- Carrega as palavras e sorteia a primeira palavra.
-- ============================================================
AddEventHandler('onResourceStart', function(resourceName)
    if resourceName == GetCurrentResourceName() then
        CarregarPalavras()
        SortearPalavra()
    end
end)

-- ============================================================
-- CALLBACK: lumos_termo:SolicitarPalavra
-- Descrição: Chamado pelo cliente para obter o tamanho
-- da palavra atual (nunca envia a palavra em si por segurança).
-- Retorna apenas o número de letras.
-- ============================================================
RegisterNetEvent('lumos_termo:SolicitarPalavra', function()
    local src = source
    TriggerClientEvent('lumos_termo:ReceberTamanhoPalavra', src, #palavraAtual)
end)

-- ============================================================
-- CALLBACK: lumos_termo:ValidarTentativa
-- Descrição: Recebe uma tentativa do cliente, valida se é
-- uma palavra existente na lista e compara letra por letra
-- com a palavra atual. Retorna o resultado da comparação.
-- Estados: "correto" = letra certa e posição certa
--          "presente" = letra certa mas posição errada
--          "ausente"  = letra não existe na palavra
-- ============================================================
RegisterNetEvent('lumos_termo:ValidarTentativa', function(tentativa)
    local src = source
    tentativa = string.upper(TrimString(tentativa))

    -- Valida se a tentativa existe no banco de palavras
    local existe = false
    for _, p in ipairs(palavras) do
        if string.upper(p) == tentativa then
            existe = true
            break
        end
    end

    if not existe then
        TriggerClientEvent('lumos_termo:ResultadoTentativa', src, nil, "invalida")
        return
    end

    -- Compara letra por letra e monta o array de resultados
    local resultado = {}
    for i = 1, #tentativa do
        local letraTentativa = string.sub(tentativa, i, i)
        local letraCorreta   = string.sub(palavraAtual, i, i)

        if letraTentativa == letraCorreta then
            resultado[i] = "correto"
        elseif string.find(palavraAtual, letraTentativa, 1, true) then
            resultado[i] = "presente"
        else
            resultado[i] = "ausente"
        end
    end

    -- Verifica se o jogador ganhou (todas as letras corretas)
    local ganhou = (tentativa == palavraAtual)
    TriggerClientEvent('lumos_termo:ResultadoTentativa', src, resultado, ganhou and "ganhou" or "continua")
end)

-- ============================================================
-- CALLBACK: lumos_termo:RevelarPalavra
-- Descrição: Chamado pelo cliente quando o jogador esgota
-- as tentativas (derrota), para revelar a palavra correta.
-- ============================================================
RegisterNetEvent('lumos_termo:RevelarPalavra', function()
    local src = source
    TriggerClientEvent('lumos_termo:PalavraRevelada', src, palavraAtual)
end)

-- ============================================================
-- EVENTO: lumos_termo:AdminAdicionarPalavra
-- Descrição: Permite que admins adicionem novas palavras ao
-- banco via painel. Verifica permissão antes de executar.
-- ============================================================
RegisterNetEvent('lumos_termo:AdminAdicionarPalavra', function(palavra)
    local src = source

    -- Verifica se o jogador tem permissão de admin
    if not IsPlayerAceAllowed(src, "lumos_termo.admin") then
        TriggerClientEvent('lumos_termo:AdminResposta', src, false, Config.Mensagens.SemPermissao)
        return
    end

    palavra = string.lower(TrimString(palavra))
    if palavra == "" then
        TriggerClientEvent('lumos_termo:AdminResposta', src, false, "Palavra inválida!")
        return
    end

    -- Verifica se a palavra já existe para evitar duplicatas
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

-- ============================================================
-- EVENTO: lumos_termo:AdminRemoverPalavra
-- Descrição: Permite que admins removam palavras do banco.
-- Verifica permissão e atualiza o arquivo JSON.
-- ============================================================
RegisterNetEvent('lumos_termo:AdminRemoverPalavra', function(palavra)
    local src = source

    if not IsPlayerAceAllowed(src, "lumos_termo.admin") then
        TriggerClientEvent('lumos_termo:AdminResposta', src, false, Config.Mensagens.SemPermissao)
        return
    end

    palavra = string.lower(TrimString(palavra))

    local index = nil
    for i, p in ipairs(palavras) do
        if p == palavra then
            index = i
            break
        end
    end

    if not index then
        TriggerClientEvent('lumos_termo:AdminResposta', src, false, "Palavra não encontrada no Grimório!")
        return
    end

    table.remove(palavras, index)
    SalvarPalavras()

    -- Ressorteia nova palavra se a removida era a atual
    if string.upper(palavra) == palavraAtual then
        SortearPalavra()
    end

    TriggerClientEvent('lumos_termo:AdminResposta', src, true, Config.Mensagens.PalavraRemov)
end)

-- ============================================================
-- EVENTO: lumos_termo:AdminListarPalavras
-- Descrição: Envia a lista completa de palavras para o
-- painel admin exibir. Apenas admins podem acessar.
-- ============================================================
RegisterNetEvent('lumos_termo:AdminListarPalavras', function()
    local src = source

    if not IsPlayerAceAllowed(src, "lumos_termo.admin") then
        return
    end

    TriggerClientEvent('lumos_termo:ReceberListaPalavras', src, palavras)
end)

-- ============================================================
-- EVENTO: lumos_termo:AdminSortearNovaPalavra
-- Descrição: Força um novo sorteio de palavra. Útil para
-- o admin reiniciar o jogo manualmente.
-- ============================================================
RegisterNetEvent('lumos_termo:AdminSortearNovaPalavra', function()
    local src = source

    if not IsPlayerAceAllowed(src, "lumos_termo.admin") then
        return
    end

    SortearPalavra()
    TriggerClientEvent('lumos_termo:AdminResposta', src, true, "Nova palavra sorteada com sucesso!")
end)