import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Lumos Termo" },
      { name: "description", content: "Adivinhe a palavra do Mundo Bruxo" },
    ],
  }),
  component: Index,
});

// ─── BANCO DE PALAVRAS POR DIFICULDADE ─────────────────────────────────────
// Fácil  → 5 letras  (palavras bem conhecidas, curtas)
// Médio  → 6-7 letras (nomes e termos intermediários)
// Difícil→ 8-10 letras (palavras longas e desafiadoras)

const PALAVRAS_FACIL = [
  "HARRY", "DRACO", "AVADA", "LUMOS", "ACCIO", "DOBBY", "PEDRA",
  "MANTO", "FELIX", "BRUXO", "SQUIB", "MAGIA", "SALAO", "SNITCH",
  "CALICE", "QUAFFLE", "NIMBUS",
].map(p => p.toUpperCase()).filter(p => p.length === 5);

const PALAVRAS_MEDIO = [
  "HAGRID", "SEVERO", "MINERVA", "NEVILLE", "HERMINE", "PATRONO",
  "EXPECTO", "KEDAVRA", "CRUCIO", "IMPERIO", "HORCRUX", "AZKABAN",
  "DEMENTOR", "SONSERINA", "CORVINAL", "LUFALUFA", "FAWKES",
  "BASILISCO", "KREACHER", "VARETA", "BEZOAR", "POLISSUCO", "MUGGLE",
  "PROFECIA", "CAMARA", "SEGREDO", "FEITICO", "TROUXA", "VARINHA",
  "VASSOURA", "CORUJA", "TRASGO",
].map(p => p.toUpperCase()).filter(p => p.length >= 6 && p.length <= 7);

const PALAVRAS_DIFICIL = [
  "DUMBLEDORE", "VOLDEMORT", "DEMENTADOR", "GRIFINORIO", "OLLIVANDER",
  "ALOHOMORA", "WINGARDIUM", "RIDDIKULUS", "SECTUMSEMPRA", "EXPELLIARMUS",
  "VERITASERUM", "FIREBOLT", "HOGWARTS", "BASILISCO", "QUIDDITCH",
].map(p => p.toUpperCase()).filter(p => p.length >= 8);

type Modo = "facil" | "medio" | "dificil";

const MODOS = {
  facil:    { label: "Fácil",    emoji: "🌟", letras: 5, tentativas: 6, palavras: PALAVRAS_FACIL,    desc: "5 letras · 6 tentativas" },
  medio:    { label: "Médio",    emoji: "🔥", letras: 7, tentativas: 6, palavras: PALAVRAS_MEDIO,    desc: "6-7 letras · 6 tentativas" },
  dificil:  { label: "Difícil",  emoji: "💀", letras: 10, tentativas: 5, palavras: PALAVRAS_DIFICIL, desc: "8-10 letras · 5 tentativas" },
};

const TECLADO_LINHAS = [
  ['Q','W','E','R','T','Y','U','I','O','P'],
  ['A','S','D','F','G','H','J','K','L'],
  ['ENTER','Z','X','C','V','B','N','M','⌫']
];

function calcularResultado(chute: string[], sorteada: string): string[] {
  const resultado = Array(chute.length).fill("ausente");
  const letrasRestantes = sorteada.split("");
  for (let i = 0; i < chute.length; i++) {
    if (chute[i] === sorteada[i]) {
      resultado[i] = "correto";
      letrasRestantes[i] = "";
    }
  }
  for (let i = 0; i < chute.length; i++) {
    if (resultado[i] !== "correto" && letrasRestantes.includes(chute[i])) {
      resultado[i] = "presente";
      letrasRestantes[letrasRestantes.indexOf(chute[i])] = "";
    }
  }
  return resultado;
}

// ─── TELA DE SELEÇÃO DE MODO ────────────────────────────────────────────────
function TelaModo({ onSelect }: { onSelect: (m: Modo) => void }) {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div
        className="relative bg-[var(--cor-fundo)] border-2 border-[var(--cor-dourado)] rounded-2xl p-8 w-[440px] max-w-full flex flex-col items-center gap-6"
        style={{ boxShadow: '0 0 60px rgba(212, 160, 23, 0.3), inset 0 0 40px rgba(13, 10, 26, 0.8)' }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl" style={{ filter: 'drop-shadow(0 0 10px var(--cor-dourado))' }}>⚡</span>
          <h1 className="font-['Georgia'] text-2xl uppercase tracking-[4px]" style={{ color: 'var(--cor-texto)' }}>
            Lumos <span style={{ color: 'var(--cor-dourado)' }}>Termo</span>
          </h1>
        </div>

        <p className="text-[11px] uppercase tracking-[2px] text-center" style={{ color: 'var(--cor-texto-suave)' }}>
          Escolha sua dificuldade, bruxo
        </p>

        <div className="w-full flex flex-col gap-3 mt-2">
          {(Object.keys(MODOS) as Modo[]).map((modo) => {
            const { label, emoji, desc } = MODOS[modo];
            const cores = {
              facil:   { ring: '#3a7d44', glow: 'rgba(58,125,68,0.3)',   text: '#70c080' },
              medio:   { ring: '#b07d1a', glow: 'rgba(176,125,26,0.3)', text: '#f0c030' },
              dificil: { ring: '#8b2020', glow: 'rgba(139,32,32,0.3)',  text: '#e07070' },
            }[modo];

            return (
              <button
                key={modo}
                onClick={() => onSelect(modo)}
                className="w-full p-4 rounded-xl border-2 flex items-center gap-4 text-left transition-all duration-200 group cursor-pointer"
                style={{
                  background: 'var(--cor-fundo-painel)',
                  borderColor: 'var(--cor-borda)',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = cores.ring;
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 0 20px ${cores.glow}`;
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--cor-borda)';
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
                }}
              >
                <span className="text-3xl">{emoji}</span>
                <div className="flex-1">
                  <p className="font-bold font-['Georgia'] text-base" style={{ color: cores.text }}>{label}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--cor-texto-suave)' }}>{desc}</p>
                </div>
                <span style={{ color: 'var(--cor-texto-suave)' }} className="text-lg group-hover:translate-x-1 transition-transform">›</span>
              </button>
            );
          })}
        </div>

        <Link
          to="/admin"
          className="mt-2 text-xs tracking-wider flex items-center gap-1.5 transition-colors"
          style={{ color: 'var(--cor-texto-suave)' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--cor-dourado)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--cor-texto-suave)')}
        >
          ⚙️ Painel Admin
        </Link>
      </div>
    </div>
  );
}

// ─── TELA DO JOGO ────────────────────────────────────────────────────────────
function TelaJogo({ modo, onVoltar }: { modo: Modo; onVoltar: () => void }) {
  const cfg = MODOS[modo];
  const TAMANHO = cfg.letras;
  const MAX_TENT = cfg.tentativas;

  const [palavraSorteada, setPalavraSorteada] = useState("");
  const [tabuleiro, setTabuleiro] = useState<string[][]>([]);
  const [resultados, setResultados] = useState<(string[] | null)[]>([]);
  const [tentativaAtual, setTentativaAtual] = useState(0);
  const [letraAtual, setLetraAtual] = useState(0);
  const [jogoAtivo, setJogoAtivo] = useState(true);
  const [estadoLetras, setEstadoLetras] = useState<Record<string, string>>({});
  const [mensagem, setMensagem] = useState<{ texto: string; tipo: string } | null>(null);
  const [status, setStatus] = useState<"ganhou" | "perdeu" | null>(null);
  const [shakeRow, setShakeRow] = useState<number | null>(null);
  const [celebrarRow, setCelebrarRow] = useState<number | null>(null);

  const sortearPalavra = useCallback(() => {
    // Tenta ler o banco v2 (com subcategorias por dificuldade)
    try {
      const raw = localStorage.getItem("lumos_banco_v2");
      if (raw) {
        const banco = JSON.parse(raw) as { facil: string[]; medio: string[]; dificil: string[] };
        let lista: string[] = [];
        if (modo === "facil")   lista = banco.facil;
        if (modo === "medio")   lista = banco.medio;
        if (modo === "dificil") lista = banco.dificil;
        if (lista.length > 0) return lista[Math.floor(Math.random() * lista.length)];
      }
    } catch { /* ignora */ }
    // Fallback: banco embutido
    return cfg.palavras[Math.floor(Math.random() * cfg.palavras.length)];
  }, [cfg.palavras, modo]);

  const initGame = useCallback(() => {
    const p = sortearPalavra();
    setPalavraSorteada(p);
    setTabuleiro(Array.from({ length: MAX_TENT }, () => Array(p.length).fill("")));
    setResultados(Array.from({ length: MAX_TENT }, () => null));
    setTentativaAtual(0);
    setLetraAtual(0);
    setJogoAtivo(true);
    setEstadoLetras({});
    setMensagem(null);
    setStatus(null);
    setShakeRow(null);
    setCelebrarRow(null);
  }, [sortearPalavra, MAX_TENT]);

  useEffect(() => { initGame(); }, [initGame]);

  const showMensagem = (texto: string, tipo: string) => {
    setMensagem({ texto, tipo });
    setTimeout(() => setMensagem(null), 2000);
  };

  const processarTecla = useCallback((tecla: string) => {
    if (!jogoAtivo || !palavraSorteada) return;
    const tam = palavraSorteada.length;

    if (tecla === 'ENTER') {
      if (letraAtual < tam) {
        showMensagem("✨ Complete a palavra antes de enviar!", "aviso");
        setShakeRow(tentativaAtual);
        setTimeout(() => setShakeRow(null), 500);
        return;
      }

      const chute = tabuleiro[tentativaAtual];
      const res = calcularResultado(chute, palavraSorteada);

      // Atualiza resultados
      setResultados(prev => {
        const novo = [...prev];
        novo[tentativaAtual] = res;
        return novo;
      });

      // Atualiza estado das teclas
      const newEstadoLetras = { ...estadoLetras };
      const prioridade: Record<string, number> = { correto: 3, presente: 2, ausente: 1 };
      chute.forEach((letra, i) => {
        const novoEstado = res[i];
        const atual = newEstadoLetras[letra];
        if (!atual || prioridade[novoEstado] > prioridade[atual]) {
          newEstadoLetras[letra] = novoEstado;
        }
      });
      setEstadoLetras(newEstadoLetras);

      const isGanhou = chute.join("") === palavraSorteada;
      if (isGanhou) {
        setCelebrarRow(tentativaAtual);
        setTimeout(() => setJogoAtivo(false), 500);
        setTimeout(() => setStatus("ganhou"), 900);
      } else if (tentativaAtual >= MAX_TENT - 1) {
        setTimeout(() => setJogoAtivo(false), 300);
        setTimeout(() => setStatus("perdeu"), 700);
      } else {
        setTentativaAtual(prev => prev + 1);
        setLetraAtual(0);
      }
    } else if (tecla === '⌫' || tecla === 'BACKSPACE') {
      if (letraAtual > 0) {
        const newTab = tabuleiro.map(r => [...r]);
        newTab[tentativaAtual][letraAtual - 1] = "";
        setTabuleiro(newTab);
        setLetraAtual(prev => prev - 1);
      }
    } else if (/^[A-ZÇÃÕÊÁÉÍÓÚÀa-zçãõêáéíóúà]$/.test(tecla)) {
      if (letraAtual < tam) {
        const newTab = tabuleiro.map(r => [...r]);
        newTab[tentativaAtual][letraAtual] = tecla.toUpperCase();
        setTabuleiro(newTab);
        setLetraAtual(prev => prev + 1);
      }
    }
  }, [jogoAtivo, letraAtual, tentativaAtual, tabuleiro, palavraSorteada, estadoLetras, MAX_TENT]);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      let key = e.key.toUpperCase();
      if (key === 'BACKSPACE') key = '⌫';
      processarTecla(key);
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [processarTecla]);

  const tamCelula = palavraSorteada.length <= 5 ? 56 : palavraSorteada.length <= 7 ? 44 : 36;
  const fontCelula = palavraSorteada.length <= 5 ? 24 : palavraSorteada.length <= 7 ? 18 : 14;

  const badgeCores = {
    facil:   { bg: 'rgba(58,125,68,0.15)',   border: '#3a7d44', text: '#70c080' },
    medio:   { bg: 'rgba(176,125,26,0.15)',  border: '#b07d1a', text: '#f0c030' },
    dificil: { bg: 'rgba(139,32,32,0.15)',   border: '#8b2020', text: '#e07070' },
  }[modo];

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div
        className="relative bg-[var(--cor-fundo)] border-2 border-[var(--cor-dourado)] rounded-2xl p-6 max-w-full flex flex-col items-center gap-4"
        style={{
          width: palavraSorteada.length <= 5 ? '420px' : palavraSorteada.length <= 7 ? '480px' : '560px',
          boxShadow: '0 0 60px rgba(212, 160, 23, 0.3), inset 0 0 40px rgba(13, 10, 26, 0.8)'
        }}
      >
        {/* Header */}
        <div className="w-full flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-2xl" style={{ filter: 'drop-shadow(0 0 8px var(--cor-dourado))' }}>⚡</span>
            <h1 className="font-['Georgia'] text-xl uppercase tracking-[4px]" style={{ color: 'var(--cor-texto)' }}>
              Lumos <span style={{ color: 'var(--cor-dourado)' }}>Termo</span>
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {/* Badge de dificuldade */}
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-widest border"
              style={{ background: badgeCores.bg, borderColor: badgeCores.border, color: badgeCores.text }}>
              {cfg.emoji} {cfg.label}
            </span>
            <button
              onClick={onVoltar}
              className="text-[var(--cor-texto-suave)] hover:text-[var(--cor-dourado)] transition-colors text-sm font-bold flex items-center justify-center border border-[var(--cor-borda)] hover:border-[var(--cor-dourado)] rounded-md px-2.5 py-1.5 bg-[var(--cor-fundo-painel)] cursor-pointer"
            >
              ← Modos
            </button>
          </div>
        </div>

        <p className="text-[11px] uppercase tracking-[2px]" style={{ color: 'var(--cor-texto-suave)' }}>
          Adivinhe a palavra do Mundo Bruxo
        </p>

        {/* Mensagem de status */}
        {mensagem && (
          <div className="absolute top-[88px] px-4 py-2 rounded-lg text-sm text-center z-10"
            style={{
              background: mensagem.tipo === 'aviso' ? 'rgba(176, 125, 26, 0.2)' : 'rgba(180, 40, 40, 0.2)',
              color: mensagem.tipo === 'aviso' ? 'var(--cor-dourado-hover)' : '#e07070',
              border: `1px solid ${mensagem.tipo === 'aviso' ? 'var(--cor-presente)' : '#8b2020'}`
            }}>
            {mensagem.texto}
          </div>
        )}

        {/* Tabuleiro */}
        <div className="flex flex-col gap-[5px] mt-2 mb-2">
          {tabuleiro.map((linha, i) => (
            <div key={i} className={`flex gap-[5px] ${shakeRow === i ? 'anim-shake' : ''} ${celebrarRow === i ? 'anim-celebrar' : ''}`}>
              {linha.map((letra, j) => {
                const res = resultados[i];
                const cellState = res ? `celula-estado-${res[j]}` : "";
                return (
                  <div
                    key={j}
                    className={`border-2 rounded-md flex items-center justify-center font-bold font-['Georgia'] transition-all ${letra && !res ? 'border-[var(--cor-dourado)] anim-pop' : !res ? 'border-[var(--cor-celula-borda)]' : ''} ${cellState}`}
                    style={{
                      width: tamCelula, height: tamCelula, fontSize: fontCelula,
                      background: cellState ? undefined : 'var(--cor-celula)',
                      color: cellState ? undefined : 'var(--cor-texto)'
                    }}
                  >
                    {letra}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Teclado */}
        <div className="flex flex-col gap-[5px] w-full">
          {TECLADO_LINHAS.map((linha, i) => (
            <div key={i} className="flex justify-center gap-[4px]">
              {linha.map(tecla => {
                const isBig = tecla === 'ENTER' || tecla === '⌫';
                const estado = estadoLetras[tecla];
                const bg = estado === 'correto' ? 'var(--cor-correto)' : estado === 'presente' ? 'var(--cor-presente)' : estado === 'ausente' ? 'var(--cor-ausente)' : 'var(--cor-fundo-painel)';
                const border = estado ? bg : 'var(--cor-borda)';
                const color = estado === 'ausente' ? 'var(--cor-texto-suave)' : estado ? '#fff' : 'var(--cor-texto)';
                return (
                  <button
                    key={tecla}
                    onClick={() => processarTecla(tecla)}
                    className="h-[44px] rounded-md font-bold transition-all hover:brightness-110 active:scale-95 flex items-center justify-center cursor-pointer"
                    style={{
                      minWidth: isBig ? '52px' : '32px',
                      padding: '0 6px',
                      background: bg, borderColor: border,
                      borderWidth: '1px', borderStyle: 'solid',
                      color, fontSize: isBig ? '10px' : '13px'
                    }}
                  >
                    {tecla}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Tela de fim de jogo */}
        {status && (
          <div className="absolute inset-0 bg-[var(--cor-fundo)]/90 backdrop-blur-sm z-20 flex items-center justify-center rounded-2xl">
            <div className="bg-[var(--cor-fundo)] border-2 border-[var(--cor-dourado)] rounded-2xl p-8 text-center w-[320px]"
              style={{ boxShadow: '0 0 80px rgba(212, 160, 23, 0.4)' }}>
              <div className="text-[52px] mb-3">{status === 'ganhou' ? '⚡' : '🐍'}</div>
              <h2 className="font-['Georgia'] text-[22px] mb-2" style={{ color: 'var(--cor-dourado)' }}>
                {status === 'ganhou' ? 'Expecto Patronum!' : 'Avada Kedavra...'}
              </h2>
              <p className="text-[13px] mb-1" style={{ color: 'var(--cor-texto-suave)' }}>
                {status === 'ganhou'
                  ? ['Você domina as artes das palavras!', 'Dumbledore ficaria orgulhoso!', 'Digno de um estudante de Hogwarts!'][Math.floor(Math.random() * 3)]
                  : 'Você foi derrotado desta vez. A palavra era:'}
              </p>
              {status === 'perdeu' && (
                <p className="font-['Georgia'] text-[22px] tracking-[4px] my-3" style={{ color: 'var(--cor-dourado-hover)' }}>
                  {palavraSorteada}
                </p>
              )}
              <button
                onClick={initGame}
                className="w-full py-3 mt-3 rounded-lg font-bold text-[#0d0a1a] transition-all cursor-pointer"
                style={{ background: 'var(--cor-dourado)' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--cor-dourado-hover)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'var(--cor-dourado)')}
              >
                🔮 Jogar Novamente
              </button>
              <button
                onClick={onVoltar}
                className="w-full py-2 mt-2 rounded-lg text-sm transition-all cursor-pointer"
                style={{ background: 'transparent', border: '1px solid var(--cor-borda)', color: 'var(--cor-texto-suave)' }}
                onMouseEnter={e => { (e.currentTarget.style.borderColor = 'var(--cor-dourado)'); (e.currentTarget.style.color = 'var(--cor-dourado)'); }}
                onMouseLeave={e => { (e.currentTarget.style.borderColor = 'var(--cor-borda)'); (e.currentTarget.style.color = 'var(--cor-texto-suave)'); }}
              >
                ← Mudar Dificuldade
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── COMPONENTE RAIZ ─────────────────────────────────────────────────────────
function Index() {
  const [modoSelecionado, setModoSelecionado] = useState<Modo | null>(null);

  if (!modoSelecionado) {
    return <TelaModo onSelect={setModoSelecionado} />;
  }

  return <TelaJogo modo={modoSelecionado} onVoltar={() => setModoSelecionado(null)} />;
}
