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

const DEFAULT_PALAVRAS = [
  "HARRY", "DRACO", "AVADA", "LUMOS", "ACCIO", "DOBBY", "PEDRA", "MANTO", "FELIX", "BRUXO", "SQUIB", "MAGIA", "SALAO"
];

const TECLADO_LINHAS = [
  ['Q','W','E','R','T','Y','U','I','O','P'],
  ['A','S','D','F','G','H','J','K','L'],
  ['ENTER','Z','X','C','V','B','N','M','⌫']
];

const MAX_TENTATIVAS = 6;
const TAMANHO_PALAVRA = 5;

function Index() {
  const [palavras, setPalavras] = useState<string[]>([]);
  const [palavraSorteada, setPalavraSorteada] = useState("");
  const [tabuleiro, setTabuleiro] = useState<string[][]>([]);
  const [tentativaAtual, setTentativaAtual] = useState(0);
  const [letraAtual, setLetraAtual] = useState(0);
  const [jogoAtivo, setJogoAtivo] = useState(true);
  const [estadoLetras, setEstadoLetras] = useState<Record<string, string>>({});
  const [mensagem, setMensagem] = useState<{ texto: string; tipo: string } | null>(null);
  const [status, setStatus] = useState<"ganhou" | "perdeu" | null>(null);
  const [shakeRow, setShakeRow] = useState<number | null>(null);
  const [celebrarRow, setCelebrarRow] = useState<number | null>(null);

  useEffect(() => {
    const salvas = localStorage.getItem("lumos_palavras");
    if (salvas) {
      setPalavras(JSON.parse(salvas));
    } else {
      setPalavras(DEFAULT_PALAVRAS);
      localStorage.setItem("lumos_palavras", JSON.stringify(DEFAULT_PALAVRAS));
    }
  }, []);

  const initGame = useCallback(() => {
    // Only pick a word if we have words loaded. 
    // If not, we wait for the useEffect.
    const lista = palavras.length > 0 ? palavras : DEFAULT_PALAVRAS;
    const p = lista[Math.floor(Math.random() * lista.length)];
    setPalavraSorteada(p);
    setTabuleiro(Array.from({ length: MAX_TENTATIVAS }, () => Array(TAMANHO_PALAVRA).fill("")));
    setTentativaAtual(0);
    setLetraAtual(0);
    setJogoAtivo(true);
    setEstadoLetras({});
    setMensagem(null);
    setStatus(null);
    setShakeRow(null);
    setCelebrarRow(null);
  }, [palavras]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const showMensagem = (texto: string, tipo: string) => {
    setMensagem({ texto, tipo });
    setTimeout(() => setMensagem(null), 2000);
  };

  const processarTecla = useCallback((tecla: string) => {
    if (!jogoAtivo) return;

    if (tecla === 'ENTER') {
      if (letraAtual < TAMANHO_PALAVRA) {
        showMensagem("✨ Complete a palavra antes de enviar!", "aviso");
        setShakeRow(tentativaAtual);
        setTimeout(() => setShakeRow(null), 500);
        return;
      }

      const palavra = tabuleiro[tentativaAtual].join("");
      
      const resultado = Array(TAMANHO_PALAVRA).fill("ausente");
      const letrasRestantes = palavraSorteada.split("");

      for (let i = 0; i < TAMANHO_PALAVRA; i++) {
        if (palavra[i] === palavraSorteada[i]) {
          resultado[i] = "correto";
          letrasRestantes[i] = "";
        }
      }

      for (let i = 0; i < TAMANHO_PALAVRA; i++) {
        if (resultado[i] !== "correto" && letrasRestantes.includes(palavra[i])) {
          resultado[i] = "presente";
          letrasRestantes[letrasRestantes.indexOf(palavra[i])] = "";
        }
      }

      const newEstadoLetras = { ...estadoLetras };
      const prioridade = { correto: 3, presente: 2, ausente: 1 };
      
      palavra.split("").forEach((letra, i) => {
        const novoEstado = resultado[i];
        const atual = newEstadoLetras[letra];
        if (!atual || prioridade[novoEstado as keyof typeof prioridade] > prioridade[atual as keyof typeof prioridade]) {
          newEstadoLetras[letra] = novoEstado;
        }
      });
      setEstadoLetras(newEstadoLetras);

      const isGanhou = palavra === palavraSorteada;

      if (isGanhou) {
        setCelebrarRow(tentativaAtual);
        setTimeout(() => setJogoAtivo(false), 500);
        setTimeout(() => setStatus("ganhou"), 1000);
      } else {
        if (tentativaAtual >= MAX_TENTATIVAS - 1) {
          setJogoAtivo(false);
          setTimeout(() => setStatus("perdeu"), 1000);
        } else {
          setTentativaAtual(prev => prev + 1);
          setLetraAtual(0);
        }
      }
    } else if (tecla === '⌫' || tecla === 'BACKSPACE') {
      if (letraAtual > 0) {
        const newTabuleiro = [...tabuleiro];
        newTabuleiro[tentativaAtual][letraAtual - 1] = "";
        setTabuleiro(newTabuleiro);
        setLetraAtual(prev => prev - 1);
      }
    } else if (/^[A-Z]$/.test(tecla)) {
      if (letraAtual < TAMANHO_PALAVRA) {
        const newTabuleiro = [...tabuleiro];
        newTabuleiro[tentativaAtual][letraAtual] = tecla;
        setTabuleiro(newTabuleiro);
        setLetraAtual(prev => prev + 1);
      }
    }
  }, [jogoAtivo, letraAtual, tentativaAtual, tabuleiro, palavraSorteada, estadoLetras]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      let key = e.key.toUpperCase();
      if (key === 'BACKSPACE') key = '⌫';
      processarTecla(key);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [processarTecla]);

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div 
        className="relative bg-[var(--cor-fundo)] border-2 border-[var(--cor-dourado)] rounded-2xl p-6 w-[420px] max-w-full flex flex-col items-center gap-4"
        style={{ boxShadow: '0 0 60px rgba(212, 160, 23, 0.3), inset 0 0 40px rgba(13, 10, 26, 0.8)' }}
      >
        <div className="w-full flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-2xl" style={{ filter: 'drop-shadow(0 0 8px var(--cor-dourado))' }}>⚡</span>
            <h1 className="font-['Georgia'] text-xl uppercase tracking-[4px]" style={{ color: 'var(--cor-texto)' }}>
              Lumos <span style={{ color: 'var(--cor-dourado)' }}>Termo</span>
            </h1>
          </div>
          <Link to="/admin" className="text-[var(--cor-texto-suave)] hover:text-[var(--cor-dourado)] transition-colors text-sm font-bold flex items-center justify-center border border-[var(--cor-borda)] hover:border-[var(--cor-dourado)] rounded-md px-3 py-1.5 bg-[var(--cor-fundo-painel)]">
            ⚙️ ADMIN
          </Link>
        </div>

        <p className="text-[12px] uppercase tracking-[2px]" style={{ color: 'var(--cor-texto-suave)' }}>
          Adivinhe a palavra do Mundo Bruxo
        </p>

        {mensagem && (
          <div className="absolute top-[80px] px-4 py-2 rounded-lg text-sm text-center z-10" 
            style={{ 
              background: mensagem.tipo === 'aviso' ? 'rgba(176, 125, 26, 0.2)' : 'rgba(180, 40, 40, 0.2)',
              color: mensagem.tipo === 'aviso' ? 'var(--cor-dourado-hover)' : '#e07070',
              border: `1px solid ${mensagem.tipo === 'aviso' ? 'var(--cor-presente)' : '#8b2020'}`
            }}>
            {mensagem.texto}
          </div>
        )}

        <div className="flex flex-col gap-[6px] mt-2 mb-4">
          {tabuleiro.map((linha, i) => (
            <div key={i} className={`flex gap-[6px] ${shakeRow === i ? 'anim-shake' : ''} ${celebrarRow === i ? 'anim-celebrar' : ''}`}>
              {linha.map((letra, j) => {
                let cellState = "";
                
                if (i < tentativaAtual || (status === "ganhou" && i === tentativaAtual) || (!jogoAtivo && i === tentativaAtual)) {
                  const result = Array(TAMANHO_PALAVRA).fill("ausente");
                  const pSorteada = palavraSorteada.split("");
                  
                  for(let k=0; k<TAMANHO_PALAVRA; k++) {
                    if (linha[k] === pSorteada[k]) {
                      result[k] = "correto";
                      pSorteada[k] = "";
                    }
                  }
                  for(let k=0; k<TAMANHO_PALAVRA; k++) {
                    if (result[k] !== "correto" && pSorteada.includes(linha[k])) {
                      result[k] = "presente";
                      pSorteada[pSorteada.indexOf(linha[k])] = "";
                    }
                  }
                  
                  cellState = `celula-estado-${result[j]}`;
                }

                return (
                  <div key={j} className={`w-[56px] h-[56px] border-2 rounded-md flex items-center justify-center text-2xl font-bold font-['Georgia'] transition-all ${letra ? 'border-[var(--cor-dourado)] anim-pop' : 'border-[var(--cor-celula-borda)]'} ${cellState}`}
                    style={{ 
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

        <div className="flex flex-col gap-[6px] w-full">
          {TECLADO_LINHAS.map((linha, i) => (
            <div key={i} className="flex justify-center gap-[5px]">
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
                    className="h-[48px] rounded-md font-bold text-[13px] transition-all hover:bg-[#2d1f4a] hover:border-[var(--cor-dourado)] active:scale-95 flex items-center justify-center"
                    style={{
                      minWidth: isBig ? '56px' : '36px',
                      padding: '0 10px',
                      background: bg,
                      borderColor: border,
                      borderWidth: '1px',
                      borderStyle: 'solid',
                      color: color,
                      fontSize: isBig ? '11px' : '13px'
                    }}
                  >
                    {tecla}
                  </button>
                )
              })}
            </div>
          ))}
        </div>

        {status && (
          <div className="absolute inset-0 bg-[var(--cor-fundo)]/90 backdrop-blur-sm z-20 flex items-center justify-center rounded-2xl">
            <div className="bg-[var(--cor-fundo)] border-2 border-[var(--cor-dourado)] rounded-2xl p-8 text-center w-[320px]"
              style={{ boxShadow: '0 0 80px rgba(212, 160, 23, 0.4)' }}
            >
              <div className="text-[56px] mb-3">{status === 'ganhou' ? '⚡' : '🐍'}</div>
              <h2 className="font-['Georgia'] text-[22px] text-[var(--cor-dourado)] mb-2">
                {status === 'ganhou' ? 'Expecto Patronum!' : 'Avada Kedavra...'}
              </h2>
              <p className="text-[14px] text-[var(--cor-texto-suave)] mb-1">
                {status === 'ganhou' ? 'Você domina as artes das palavras!' : 'Você foi derrotado desta vez. A palavra era:'}
              </p>
              {status === 'perdeu' && (
                <p className="font-['Georgia'] text-[28px] tracking-[6px] my-3" style={{ color: 'var(--cor-dourado-hover)' }}>
                  {palavraSorteada}
                </p>
              )}
              <button 
                onClick={initGame}
                className="w-full py-3 mt-4 rounded-lg font-bold text-[#0d0a1a] bg-[var(--cor-dourado)] hover:bg-[var(--cor-dourado-hover)] transition-all"
              >
                🔮 Jogar Novamente
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
