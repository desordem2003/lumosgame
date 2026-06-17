-- config.lua
-- Arquivo de configuração central. Edite aqui para personalizar o recurso
-- sem precisar mexer na lógica principal.

Config = {}

-- Tamanho padrão das palavras aceitas no jogo (número de letras)
Config.TamanhoPalavra = 5

-- Número máximo de tentativas que o jogador tem para adivinhar a palavra
Config.MaxTentativas = 6

-- Grupo de permissão necessário para acessar o painel admin
-- Certifique-se de que o grupo existe no seu server.cfg
-- Exemplo: add_ace group.admin command.lumos_admin allow
Config.GrupoAdmin = "admin"

-- Define se o sistema deve registrar logs no console do servidor
Config.Debug = false

-- Mensagens exibidas ao jogador (personalize o texto conforme a identidade do servidor)
Config.Mensagens = {
    AbrirJogo    = "[Lumos RP] Acendendo as velas do Termo...",
    SemPermissao = "[Lumos RP] Você não tem permissão para isso, Muggle!",
    PalavraAdded = "[Lumos RP] Palavra adicionada ao Grimório!",
    PalavraRemov = "[Lumos RP] Palavra removida do Grimório!",
}