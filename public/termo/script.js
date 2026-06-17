/**
 * script.js — Lógica principal da NUI do Lumos Termo
 * Gerencia o estado do jogo, comunicação com o Lua via fetch,
 * renderização do tabuleiro e teclado virtual.
 */

// ============================================================
// ESTADO GLOBAL DO JOGO
// ============================================================
const Estado = {
    tamanhoPalavra : 5,           // Quantidade de letras da palavra atual
    maxTentativas  : 6,           // Máximo de tentativas permitidas
    tentativaAtual : 0,           // Índice da linha atual (0 a 5)
    letraAtual     : 0,           // Índice da coluna atual (0 a N)
    tabuleiro      : [],          // Matriz [linhas][colunas] com as letras digitadas
    estadoLetras   : {},          // Mapa de estado de cada letra do teclado
    jogoAtivo      : true,        // Controla se o jogo ainda aceita entradas
    palavraRevelada: ""           // Armazena a palavra ao fim do jogo (se derrota)
};

// Layout do teclado virtual (3 linhas, estilo QWERTY português)
const TECLADO_LINHAS = [
    ['Q','W','E','R','T','Y','U','I','O','P'],
    ['A','S','D','F','G','H','J','K','L'],
    ['ENTER','Z','X','C','V','B','N','M','⌫']
];

// ============================================================
// UTILITÁRIO: GetParentResourceName
// Retorna o nome do recurso FiveM atual para montar a URL
// correta nas chamadas fetch para o Lua client.
// ============================================================
function GetParentResourceName() {
    return window.GetParentResourceName ? window.GetParentResourceName() : 'lumos_termo';
}

// Atalho para enviar callbacks NUI ao Lua client
function nuiPost(callback, body) {
    return fetch(`https://${GetParentResourceName()}/${callback}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body || {})
    }).catch(() => {});
}

// ============================================================
// FUNÇÃO: inicializarTabuleiro
// Cria as células do tabuleiro e os botões do teclado.
// ============================================================
function inicializarTabuleiro(tamanho) {
    Estado.tamanhoPalavra = tamanho;
    Estado.tentativaAtual = 0;
    Estado.letraAtual = 0;
    Estado.jogoAtivo = true;
    Estado.estadoLetras = {};
    Estado.tabuleiro = [];
    Estado.palavraRevelada = "";

    const tabuleiro = document.getElementById('tabuleiro');
    tabuleiro.innerHTML = '';

    for (let linha = 0; linha < Estado.maxTentativas; linha++) {
        Estado.tabuleiro[linha] = [];
        const linhaDiv = document.createElement('div');
        linhaDiv.classList.add('linha-tabuleiro');
        linhaDiv.id = `linha-${linha}`;

        for (let col = 0; col < tamanho; col++) {
            const celula = document.createElement('div');
            celula.classList.add('celula');
            celula.id = `celula-${linha}-${col}`;
            linhaDiv.appendChild(celula);
            Estado.tabuleiro[linha][col] = '';
        }

        tabuleiro.appendChild(linhaDiv);
    }

    document.getElementById('tela-resultado').classList.add('oculto');
    renderizarTeclado();
}

// ============================================================
// FUNÇÃO: renderizarTeclado
// Gera os botões do teclado virtual.
// ============================================================
function renderizarTeclado() {
    TECLADO_LINHAS.forEach((linha, i) => {
        const linhaEl = document.getElementById(`linha-teclado-${i + 1}`);
        linhaEl.innerHTML = '';
        linha.forEach(tecla => {
            const btn = document.createElement('button');
            btn.textContent = tecla;
            btn.classList.add('tecla');
            btn.id = `tecla-${tecla}`;

            if (tecla === 'ENTER') btn.classList.add('tecla-enter');
            if (tecla === '⌫')    btn.classList.add('tecla-backspace');

            btn.addEventListener('click', () => processarTecla(tecla));
            linhaEl.appendChild(btn);
        });
    });
}

// ============================================================
// FUNÇÃO: processarTecla
// Processa cada tecla pressionada (físico ou virtual).
// ============================================================
function processarTecla(tecla) {
    if (!Estado.jogoAtivo) return;

    if (tecla === 'ENTER') {
        enviarTentativa();
    } else if (tecla === '⌫' || tecla === 'BACKSPACE') {
        apagarLetra();
    } else if (/^[A-ZÇÃÕÊÁÉÍÓÚÀa-zçãõêáéíóúà]$/.test(tecla)) {
        inserirLetra(tecla.toUpperCase());
    }
}

// ============================================================
// FUNÇÃO: inserirLetra
// ============================================================
function inserirLetra(letra) {
    if (Estado.letraAtual >= Estado.tamanhoPalavra) return;

    const celula = document.getElementById(`celula-${Estado.tentativaAtual}-${Estado.letraAtual}`);
    celula.textContent = letra;
    celula.classList.add('preenchida');

    celula.classList.remove('pop');
    void celula.offsetWidth; // Força reflow para reiniciar a animação
    celula.classList.add('pop');

    Estado.tabuleiro[Estado.tentativaAtual][Estado.letraAtual] = letra;
    Estado.letraAtual++;
}

// ============================================================
// FUNÇÃO: apagarLetra
// ============================================================
function apagarLetra() {
    if (Estado.letraAtual <= 0) return;

    Estado.letraAtual--;
    const celula = document.getElementById(`celula-${Estado.tentativaAtual}-${Estado.letraAtual}`);
    celula.textContent = '';
    celula.classList.remove('preenchida');
    Estado.tabuleiro[Estado.tentativaAtual][Estado.letraAtual] = '';
}

// ============================================================
// FUNÇÃO: enviarTentativa
// ============================================================
function enviarTentativa() {
    if (Estado.letraAtual < Estado.tamanhoPalavra) {
        mostrarMensagem("✨ Complete a palavra antes de enviar!", "aviso");
        animarLinha(Estado.tentativaAtual, 'shake');
        return;
    }

    const palavra = Estado.tabuleiro[Estado.tentativaAtual].join('');
    nuiPost('enviarTentativa', { palavra: palavra });
}

// ============================================================
// FUNÇÃO: mostrarResultado
// resultado — array: "correto" | "presente" | "ausente"
// status    — "ganhou" | "continua" | "invalida"
// ============================================================
function mostrarResultado(resultado, status) {
    if (status === "invalida") {
        mostrarMensagem("🦉 Palavra não encontrada no Grimório!", "erro");
        animarLinha(Estado.tentativaAtual, 'shake');
        return;
    }

    const palavra = Estado.tabuleiro[Estado.tentativaAtual];

    resultado.forEach((estado, i) => {
        setTimeout(() => {
            const celula = document.getElementById(`celula-${Estado.tentativaAtual}-${i}`);
            celula.classList.add('revelando');

            setTimeout(() => {
                celula.classList.remove('revelando');
                celula.classList.add(`estado-${estado}`);
                atualizarTecla(palavra[i], estado);
            }, 250);
        }, i * 120);
    });

    const totalDelay = resultado.length * 120 + 300;

    setTimeout(() => {
        if (status === "ganhou") {
            animarLinha(Estado.tentativaAtual, 'celebrar');
            setTimeout(() => exibirTelaFim(true), 600);
        } else {
            Estado.tentativaAtual++;
            Estado.letraAtual = 0;

            if (Estado.tentativaAtual >= Estado.maxTentativas) {
                // Esgotou tentativas: pede a palavra correta ao servidor
                nuiPost('revelarPalavra', {});
                exibirTelaFim(false);
            }
        }
    }, totalDelay);
}

// ============================================================
// FUNÇÃO: atualizarTecla
// Prioridade: correto > presente > ausente (não regride).
// ============================================================
function atualizarTecla(letra, novoEstado) {
    const prioridade = { "correto": 3, "presente": 2, "ausente": 1 };
    const estadoAtual = Estado.estadoLetras[letra];

    if (!estadoAtual || prioridade[novoEstado] > prioridade[estadoAtual]) {
        Estado.estadoLetras[letra] = novoEstado;
        const tecla = document.getElementById(`tecla-${letra}`);
        if (tecla) {
            tecla.className = `tecla estado-${novoEstado}`;
            if (novoEstado === 'correto') tecla.classList.add('tecla-enter');
        }
    }
}

// ============================================================
// FUNÇÃO: exibirTelaFim
// ============================================================
function exibirTelaFim(ganhou) {
    Estado.jogoAtivo = false;

    const telaResultado = document.getElementById('tela-resultado');
    const icone   = document.getElementById('resultado-icone');
    const titulo  = document.getElementById('resultado-titulo');
    const msg     = document.getElementById('resultado-mensagem');
    const palavra = document.getElementById('resultado-palavra');

    if (ganhou) {
        icone.textContent = "⚡";
        titulo.textContent = "Expecto Patronum!";
        const frases = [
            "Você domina as artes das palavras!",
            "Dumbledore ficaria orgulhoso!",
            "Digno de um Estudante de Hogwarts!",
            "O Grifinório marca pontos!"
        ];
        msg.textContent = frases[Math.floor(Math.random() * frases.length)];
        palavra.textContent = "";
    } else {
        icone.textContent = "🐍";
        titulo.textContent = "Avada Kedavra...";
        msg.textContent = "Você foi derrotado desta vez. A palavra era:";
        palavra.textContent = Estado.palavraRevelada || "...";
    }

    telaResultado.classList.remove('oculto');
    telaResultado.classList.add('fade-in');
}

// ============================================================
// FUNÇÃO: animarLinha
// ============================================================
function animarLinha(linhaIndex, animacao) {
    const linha = document.getElementById(`linha-${linhaIndex}`);
    if (!linha) return;
    linha.classList.add(animacao);
    setTimeout(() => linha.classList.remove(animacao), 600);
}

// ============================================================
// FUNÇÃO: mostrarMensagem  ("aviso" | "erro" | "sucesso")
// ============================================================
function mostrarMensagem(texto, tipo) {
    const el = document.getElementById('mensagem-status');
    el.textContent = texto;
    el.className = `mensagem-status mensagem-${tipo}`;
    el.classList.remove('oculto');
    clearTimeout(window._msgTimeout);
    window._msgTimeout = setTimeout(() => el.classList.add('oculto'), 2000);
}

// ============================================================
// FUNÇÃO: reiniciarJogo
// ============================================================
function reiniciarJogo() {
    document.getElementById('tela-resultado').classList.add('oculto');
    nuiPost('reiniciarJogo', {});
}

// ============================================================
// FUNÇÃO: fecharJogo
// ============================================================
function fecharJogo() {
    document.getElementById('jogo-container').classList.add('oculto');
    document.getElementById('admin-container').classList.add('oculto');
    nuiPost('fecharJogo', {});
}

// ============================================================
// OUVINTE: window message
// Recebe mensagens do Lua client (SendNUIMessage) E do iframe
// admin (postMessage) e roteia para a ação correta.
// ============================================================
window.addEventListener('message', function(event) {
    const dados = event.data || {};

    switch (dados.action) {
        // ----- Mensagens vindas do Lua client -----
        case 'abrirJogo':
            document.getElementById('jogo-container').classList.remove('oculto');
            document.getElementById('admin-container').classList.add('oculto');
            break;

        case 'abrirAdmin':
            document.getElementById('admin-container').classList.remove('oculto');
            document.getElementById('jogo-container').classList.add('oculto');
            break;

        case 'configurarTabuleiro':
            inicializarTabuleiro(dados.tamanho);
            break;

        case 'mostrarResultado':
            mostrarResultado(dados.resultado, dados.status);
            break;

        case 'revelarPalavra':
            Estado.palavraRevelada = (dados.palavra || "").toUpperCase();
            const pEl = document.getElementById('resultado-palavra');
            if (pEl && !Estado.jogoAtivo) pEl.textContent = Estado.palavraRevelada;
            break;

        case 'carregarListaAdmin': {
            const iframe = document.getElementById('admin-iframe');
            if (iframe && iframe.contentWindow) {
                iframe.contentWindow.postMessage({
                    action: 'carregarLista',
                    lista: dados.lista
                }, '*');
            }
            break;
        }

        case 'adminNotificacao': {
            const iframeAdmin = document.getElementById('admin-iframe');
            if (iframeAdmin && iframeAdmin.contentWindow) {
                iframeAdmin.contentWindow.postMessage({
                    action: 'notificacao',
                    sucesso: dados.sucesso,
                    mensagem: dados.mensagem
                }, '*');
            }
            break;
        }

        // ----- Mensagens vindas do iframe admin -----
        case 'adminAdicionar':
            nuiPost('adminAdicionarPalavra', { palavra: dados.palavra });
            break;

        case 'adminRemover':
            nuiPost('adminRemoverPalavra', { palavra: dados.palavra });
            break;

        case 'adminSortear':
            nuiPost('adminSortearNova', {});
            break;

        case 'fecharAdmin':
            fecharJogo();
            break;
    }
});

// ============================================================
// OUVINTE: Teclado Físico
// ============================================================
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        fecharJogo();
        return;
    }
    // Ignora teclas físicas quando o painel admin está visível
    if (!document.getElementById('admin-container').classList.contains('oculto')) return;
    processarTecla(event.key.toUpperCase());
});