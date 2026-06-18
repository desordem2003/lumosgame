-- config.lua
-- Arquivo de configuração central. Edite aqui para personalizar o recurso
-- sem precisar mexer na lógica principal.

Config = {}

-- Tamanho padrão das palavras aceitas no jogo (número de letras)
Config.TamanhoPalavra = 5

-- Número máximo de tentativas que o jogador tem para adivinhar a palavra
Config.MaxTentativas = 6

-- Grupo de permissão necessário para acessar o painel admin
Config.GrupoAdmin = "admin"

-- Define se o sistema deve registrar logs no console do servidor
Config.Debug = false

-- ── CONFIGURAÇÕES DO MODO MULTIPLAYER (DUELO BRUXO) ──────────────────────────

-- Número máximo de jogadores por sala de duelo
Config.MaxJogadoresSala = 8

-- Tempo (em segundos) antes de encerrar o duelo e mostrar placar parcial
-- caso algum jogador não termine no tempo
Config.TimeoutDuelo = 180

-- Mensagens exibidas ao jogador (personalize conforme a identidade do servidor)
Config.Mensagens = {
    AbrirJogo    = "[Lumos RP] Acendendo as velas do Termo...",
    SemPermissao = "[Lumos RP] Você não tem permissão para isso, Muggle!",
    PalavraAdded = "[Lumos RP] Palavra adicionada ao Grimório!",
    PalavraRemov = "[Lumos RP] Palavra removida do Grimório!",
    DueloCriado  = "[Lumos RP] Sala de duelo criada! Compartilhe o código com seus amigos.",
    DueloEntrou  = "[Lumos RP] Você entrou no duelo! Aguardando o dono iniciar.",
    DueloInvalid = "[Lumos RP] Código de sala inválido ou sala não encontrada.",
    DueloLleno   = "[Lumos RP] Esta sala já está cheia!",
}