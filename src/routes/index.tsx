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

type TipoJogo = "solo" | "duelo";

// ─── TELA 1: SELEÇÃO DE TIPO (SOLO vs DUELO) ────────────────────────────────
function TelaSelecaoTipo({ onSelect }: { onSelect: (t: TipoJogo) => void }) {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div
        className="relative bg-[var(--cor-fundo)] border-2 border-[var(--cor-dourado)] rounded-2xl p-8 w-[440px] max-w-full flex flex-col items-center gap-6"
        style={{ boxShadow: '0 0 60px rgba(212, 160, 23, 0.3), inset 0 0 40px rgba(13, 10, 26, 0.8)' }}
      >
        <div className="flex items-center gap-3">
          <span className="text-3xl" style={{ filter: 'drop-shadow(0 0 10px var(--cor-dourado))' }}>⚡</span>
          <h1 className="font-['Georgia'] text-2xl uppercase tracking-[4px]" style={{ color: 'var(--cor-texto)' }}>
            Lumos <span style={{ color: 'var(--cor-dourado)' }}>Termo</span>
          </h1>
        </div>

        <p className="text-[11px] uppercase tracking-[2px] text-center" style={{ color: 'var(--cor-texto-suave)' }}>
          Como deseja jogar, bruxo?
        </p>

        <div className="w-full flex flex-col gap-4 mt-2">
          {/* SOLO */}
          <button
            onClick={() => onSelect('solo')}
            className="w-full p-5 rounded-xl border-2 flex items-center gap-4 text-left transition-all duration-200 group cursor-pointer"
            style={{ background: 'var(--cor-fundo-painel)', borderColor: 'var(--cor-borda)' }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = '#d4a017';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 24px rgba(212,160,23,0.3)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--cor-borda)';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
            }}
          >
            <span className="text-4xl">🧙</span>
            <div className="flex-1">
              <p className="font-bold font-['Georgia'] text-lg" style={{ color: 'var(--cor-dourado)' }}>Solo</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--cor-texto-suave)' }}>Jogue sozinho e teste seus conhecimentos do Mundo Bruxo</p>
            </div>
            <span className="text-xl group-hover:translate-x-1 transition-transform" style={{ color: 'var(--cor-texto-suave)' }}>›</span>
          </button>

          {/* DUELO */}
          <button
            onClick={() => onSelect('duelo')}
            className="w-full p-5 rounded-xl border-2 flex items-center gap-4 text-left transition-all duration-200 group cursor-pointer"
            style={{ background: 'var(--cor-fundo-painel)', borderColor: 'var(--cor-borda)' }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = '#7b3fbe';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 24px rgba(123,63,190,0.35)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--cor-borda)';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
            }}
          >
            <span className="text-4xl">⚔️</span>
            <div className="flex-1">
              <p className="font-bold font-['Georgia'] text-lg" style={{ color: '#c084fc' }}>Duelo Bruxo</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--cor-texto-suave)' }}>Dispute com outros bruxos do servidor — quem adivinha em menos tentativas vence!</p>
            </div>
            <span className="text-xl group-hover:translate-x-1 transition-transform" style={{ color: 'var(--cor-texto-suave)' }}>›</span>
          </button>
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

// ─── TELA 2: SELEÇÃO DE DIFICULDADE ─────────────────────────────────────────
function TelaModo({
  tipoJogo,
  onSelect,
  onVoltar,
}: {
  tipoJogo: TipoJogo;
  onSelect: (m: Modo) => void;
  onVoltar: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div
        className="relative bg-[var(--cor-fundo)] border-2 border-[var(--cor-dourado)] rounded-2xl p-8 w-[440px] max-w-full flex flex-col items-center gap-6"
        style={{ boxShadow: '0 0 60px rgba(212, 160, 23, 0.3), inset 0 0 40px rgba(13, 10, 26, 0.8)' }}
      >
        {/* Header com badge do tipo */}
        <div className="w-full flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-2xl" style={{ filter: 'drop-shadow(0 0 8px var(--cor-dourado))' }}>⚡</span>
            <h1 className="font-['Georgia'] text-xl uppercase tracking-[4px]" style={{ color: 'var(--cor-texto)' }}>
              Lumos <span style={{ color: 'var(--cor-dourado)' }}>Termo</span>
            </h1>
          </div>
          <button
            onClick={onVoltar}
            className="text-xs flex items-center gap-1 px-3 py-1.5 rounded-md border transition-all cursor-pointer"
            style={{ borderColor: 'var(--cor-borda)', color: 'var(--cor-texto-suave)', background: 'var(--cor-fundo-painel)' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--cor-dourado)'; e.currentTarget.style.color = 'var(--cor-dourado)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--cor-borda)'; e.currentTarget.style.color = 'var(--cor-texto-suave)'; }}
          >
            ← Voltar
          </button>
        </div>

        {/* Badge do tipo selecionado */}
        <div className="flex items-center gap-2 px-4 py-2 rounded-full border"
          style={{
            borderColor: tipoJogo === 'solo' ? 'var(--cor-dourado)' : '#7b3fbe',
            background: tipoJogo === 'solo' ? 'rgba(212,160,23,0.1)' : 'rgba(123,63,190,0.1)',
          }}>
          <span>{tipoJogo === 'solo' ? '🧙' : '⚔️'}</span>
          <span className="text-xs font-bold uppercase tracking-widest"
            style={{ color: tipoJogo === 'solo' ? 'var(--cor-dourado)' : '#c084fc' }}>
            {tipoJogo === 'solo' ? 'Modo Solo' : 'Duelo Bruxo'}
          </span>
        </div>

        <p className="text-[11px] uppercase tracking-[2px] text-center" style={{ color: 'var(--cor-texto-suave)' }}>
          Escolha a dificuldade
        </p>

        <div className="w-full flex flex-col gap-3">
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
                style={{ background: 'var(--cor-fundo-painel)', borderColor: 'var(--cor-borda)' }}
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
      </div>
    </div>
  );
}

// ─── TELA LOBBY DUELO ───────────────────────────────────────────────────────
function TelaLobbyDuelo({ modo, onVoltar }: { modo: Modo; onVoltar: () => void }) {
  const [tela, setTela] = useState<'opcao' | 'criar' | 'entrar'>('opcao');
  const [codigoInput, setCodigoInput] = useState('');
  const [codigoGerado] = useState(() => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    let c = '';
    for (let i = 0; i < 4; i++) c += chars[Math.floor(Math.random() * chars.length)];
    return c;
  });
  const [copiado, setCopiado] = useState(false);

  const copiarCodigo = () => {
    navigator.clipboard.writeText(codigoGerado).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    });
  };

  const cfg = MODOS[modo];
  const badgeCores = {
    facil:   { border: '#3a7d44', text: '#70c080', bg: 'rgba(58,125,68,0.1)' },
    medio:   { border: '#b07d1a', text: '#f0c030', bg: 'rgba(176,125,26,0.1)' },
    dificil: { border: '#8b2020', text: '#e07070', bg: 'rgba(139,32,32,0.1)' },
  }[modo];

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div
        className="relative bg-[var(--cor-fundo)] border-2 rounded-2xl p-8 w-[460px] max-w-full flex flex-col items-center gap-6"
        style={{ borderColor: '#7b3fbe', boxShadow: '0 0 60px rgba(123,63,190,0.3), inset 0 0 40px rgba(13,10,26,0.8)' }}
      >
        {/* Header */}
        <div className="w-full flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⚔️</span>
            <h1 className="font-['Georgia'] text-xl uppercase tracking-[3px]" style={{ color: 'var(--cor-texto)' }}>
              Duelo <span style={{ color: '#c084fc' }}>Bruxo</span>
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full border uppercase tracking-widest"
              style={{ background: badgeCores.bg, borderColor: badgeCores.border, color: badgeCores.text }}>
              {cfg.emoji} {cfg.label}
            </span>
            <button onClick={onVoltar}
              className="text-xs px-3 py-1.5 rounded-md border transition-all cursor-pointer"
              style={{ borderColor: 'var(--cor-borda)', color: 'var(--cor-texto-suave)', background: 'var(--cor-fundo-painel)' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#c084fc'; e.currentTarget.style.color = '#c084fc'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--cor-borda)'; e.currentTarget.style.color = 'var(--cor-texto-suave)'; }}
            >← Voltar</button>
          </div>
        </div>

        {tela === 'opcao' && (
          <div className="w-full flex flex-col gap-4">
            <p className="text-[11px] uppercase tracking-[2px] text-center mb-2" style={{ color: 'var(--cor-texto-suave)' }}>
              Como deseja entrar?
            </p>
            <button onClick={() => setTela('criar')}
              className="w-full p-5 rounded-xl border-2 flex items-center gap-4 text-left transition-all group cursor-pointer"
              style={{ background: 'var(--cor-fundo-painel)', borderColor: 'var(--cor-borda)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#7b3fbe'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 20px rgba(123,63,190,0.3)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--cor-borda)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none'; }}
            >
              <span className="text-3xl">🏰</span>
              <div className="flex-1">
                <p className="font-bold font-['Georgia'] text-base" style={{ color: '#c084fc' }}>Criar Sala</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--cor-texto-suave)' }}>Gere um código e convide seus amigos</p>
              </div>
              <span className="text-lg group-hover:translate-x-1 transition-transform" style={{ color: 'var(--cor-texto-suave)' }}>›</span>
            </button>
            <button onClick={() => setTela('entrar')}
              className="w-full p-5 rounded-xl border-2 flex items-center gap-4 text-left transition-all group cursor-pointer"
              style={{ background: 'var(--cor-fundo-painel)', borderColor: 'var(--cor-borda)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#7b3fbe'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 20px rgba(123,63,190,0.3)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--cor-borda)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none'; }}
            >
              <span className="text-3xl">🗺️</span>
              <div className="flex-1">
                <p className="font-bold font-['Georgia'] text-base" style={{ color: '#c084fc' }}>Entrar na Sala</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--cor-texto-suave)' }}>Informe o código de 4 letras de um amigo</p>
              </div>
              <span className="text-lg group-hover:translate-x-1 transition-transform" style={{ color: 'var(--cor-texto-suave)' }}>›</span>
            </button>
          </div>
        )}

        {tela === 'criar' && (
          <div className="w-full flex flex-col items-center gap-5">
            <p className="text-[11px] uppercase tracking-[2px] text-center" style={{ color: 'var(--cor-texto-suave)' }}>
              Compartilhe este código com seus amigos
            </p>
            <div
              className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl border-2 cursor-pointer select-all transition-all"
              style={{ borderColor: '#7b3fbe', background: 'rgba(123,63,190,0.1)' }}
              onClick={copiarCodigo}
            >
              <span className="font-['Georgia'] text-4xl font-bold tracking-[12px]" style={{ color: '#c084fc' }}>
                {codigoGerado}
              </span>
            </div>
            <button onClick={copiarCodigo}
              className="text-xs px-4 py-2 rounded-md border transition-all cursor-pointer"
              style={{ borderColor: copiado ? '#7b3fbe' : 'var(--cor-borda)', color: copiado ? '#c084fc' : 'var(--cor-texto-suave)', background: copiado ? 'rgba(123,63,190,0.1)' : 'transparent' }}
            >
              {copiado ? '✓ Código copiado!' : '📋 Copiar código'}
            </button>
            <div className="w-full border rounded-lg p-4 text-center" style={{ borderColor: 'var(--cor-borda)', background: 'var(--cor-fundo-painel)' }}>
              <p className="text-xs mb-1" style={{ color: 'var(--cor-texto-suave)' }}>No FiveM, use o comando:</p>
              <p className="font-mono text-sm font-bold" style={{ color: '#c084fc' }}>/termo_duelo</p>
              <p className="text-xs mt-2" style={{ color: 'var(--cor-texto-suave)' }}>O servidor irá gerar o código real para seus amigos entrarem com:</p>
              <p className="font-mono text-sm font-bold mt-1" style={{ color: '#c084fc' }}>/termo_duelo {codigoGerado}</p>
            </div>
            <button onClick={() => setTela('opcao')}
              className="text-xs px-4 py-2 rounded-md border transition-all cursor-pointer"
              style={{ borderColor: 'var(--cor-borda)', color: 'var(--cor-texto-suave)', background: 'transparent' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#c084fc'; e.currentTarget.style.color = '#c084fc'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--cor-borda)'; e.currentTarget.style.color = 'var(--cor-texto-suave)'; }}
            >← Voltar</button>
          </div>
        )}

        {tela === 'entrar' && (
          <div className="w-full flex flex-col items-center gap-4">
            <p className="text-[11px] uppercase tracking-[2px] text-center" style={{ color: 'var(--cor-texto-suave)' }}>
              Digite o código da sala
            </p>
            <input
              type="text"
              maxLength={4}
              value={codigoInput}
              onChange={e => setCodigoInput(e.target.value.toUpperCase())}
              className="w-full text-center p-4 rounded-xl border-2 outline-none transition-colors text-3xl tracking-[12px] font-['Georgia'] font-bold uppercase"
              style={{ background: 'var(--cor-fundo-painel)', borderColor: codigoInput.length === 4 ? '#7b3fbe' : 'var(--cor-borda)', color: '#c084fc' }}
              placeholder="XKPQ"
            />
            <div className="w-full border rounded-lg p-4 text-center" style={{ borderColor: 'var(--cor-borda)', background: 'var(--cor-fundo-painel)' }}>
              <p className="text-xs" style={{ color: 'var(--cor-texto-suave)' }}>No FiveM, use o comando:</p>
              <p className="font-mono text-sm font-bold mt-1" style={{ color: '#c084fc' }}>/termo_duelo {codigoInput || 'CÓDIGO'}</p>
            </div>
            <div className="flex gap-2 w-full">
              <button onClick={() => setTela('opcao')}
                className="flex-1 py-2.5 rounded-md border text-sm transition-all cursor-pointer"
                style={{ borderColor: 'var(--cor-borda)', color: 'var(--cor-texto-suave)', background: 'transparent' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#c084fc'; e.currentTarget.style.color = '#c084fc'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--cor-borda)'; e.currentTarget.style.color = 'var(--cor-texto-suave)'; }}
              >← Voltar</button>
              <button
                disabled={codigoInput.length !== 4}
                className="flex-1 py-2.5 rounded-md font-bold text-sm transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: codigoInput.length === 4 ? '#7b3fbe' : 'var(--cor-fundo-painel)', color: '#fff', border: 'none' }}
              >Entrar na Sala ›</button>
            </div>
          </div>
        )}
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
  const [tipoJogo, setTipoJogo] = useState<TipoJogo | null>(null);
  const [modoSelecionado, setModoSelecionado] = useState<Modo | null>(null);

  // Tela 1: Tipo de jogo
  if (!tipoJogo) {
    return <TelaSelecaoTipo onSelect={setTipoJogo} />;
  }

  // Tela 2: Dificuldade
  if (!modoSelecionado) {
    return (
      <TelaModo
        tipoJogo={tipoJogo}
        onSelect={setModoSelecionado}
        onVoltar={() => setTipoJogo(null)}
      />
    );
  }

  // Tela 3a: Lobby de Duelo
  if (tipoJogo === 'duelo') {
    return (
      <TelaLobbyDuelo
        modo={modoSelecionado}
        onVoltar={() => setModoSelecionado(null)}
      />
    );
  }

  // Tela 3b: Jogo Solo
  return (
    <TelaJogo
      modo={modoSelecionado}
      onVoltar={() => setModoSelecionado(null)}
    />
  );
}
