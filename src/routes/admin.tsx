import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";

export const Route = createFileRoute("/admin")({
  component: Admin,
});

// ─── TIPOS ──────────────────────────────────────────────────────────────────
type Modo = "facil" | "medio" | "dificil";

interface BancoPalavras {
  facil: string[];
  medio: string[];
  dificil: string[];
}

const BANCO_INICIAL: BancoPalavras = {
  facil: ["HARRY", "DRACO", "AVADA", "LUMOS", "ACCIO", "DOBBY", "PEDRA", "MANTO", "FELIX", "BRUXO", "SQUIB", "MAGIA", "SALAO"],
  medio: ["HAGRID", "SEVERO", "MINERVA", "PATRONO", "EXPECTO", "KEDAVRA", "CRUCIO", "IMPERIO", "HORCRUX", "AZKABAN", "DEMENTOR", "FEITICO", "TROUXA", "VARINHA", "VASSOURA"],
  dificil: ["DUMBLEDORE", "VOLDEMORT", "DEMENTADOR", "GRIFINORIO", "OLLIVANDER", "ALOHOMORA", "WINGARDIUM", "RIDDIKULUS", "EXPELLIARMUS", "VERITASERUM", "FIREBOLT", "HOGWARTS", "QUIDDITCH"],
};

const MODO_CFG = {
  facil:   { label: "Fácil",   emoji: "🌟", letrasDica: "5 letras",    cor: { border: "#3a7d44", bg: "rgba(58,125,68,0.15)",   text: "#70c080", badge: "rgba(58,125,68,0.25)" } },
  medio:   { label: "Médio",   emoji: "🔥", letrasDica: "6-7 letras",  cor: { border: "#b07d1a", bg: "rgba(176,125,26,0.15)", text: "#f0c030", badge: "rgba(176,125,26,0.25)" } },
  dificil: { label: "Difícil", emoji: "💀", letrasDica: "8-10 letras", cor: { border: "#8b2020", bg: "rgba(139,32,32,0.15)",  text: "#e07070", badge: "rgba(139,32,32,0.25)" } },
};

const FAIXA: Record<Modo, [number, number]> = {
  facil:   [5, 5],
  medio:   [6, 7],
  dificil: [8, 12],
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function carregarBanco(): BancoPalavras {
  try {
    const raw = localStorage.getItem("lumos_banco_v2");
    if (raw) return JSON.parse(raw);
  } catch { /* ignora */ }
  return BANCO_INICIAL;
}

function salvarBanco(banco: BancoPalavras) {
  localStorage.setItem("lumos_banco_v2", JSON.stringify(banco));
  // Mantém compatibilidade com chave antiga
  const todas = [...banco.facil, ...banco.medio, ...banco.dificil];
  localStorage.setItem("lumos_palavras", JSON.stringify(todas));
}

// ─── COMPONENTE PRINCIPAL ────────────────────────────────────────────────────
function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [senhaInput, setSenhaInput] = useState("");
  const [senhaErro, setSenhaErro] = useState(false);

  const [banco, setBanco] = useState<BancoPalavras>({ facil: [], medio: [], dificil: [] });
  const [abaAtiva, setAbaAtiva] = useState<Modo>("facil");
  const [inputPalavra, setInputPalavra] = useState("");
  const [modoAdicionar, setModoAdicionar] = useState<Modo>("facil");
  const [busca, setBusca] = useState("");
  const [notificacao, setNotificacao] = useState<{ texto: string; sucesso: boolean } | null>(null);

  useEffect(() => {
    const b = carregarBanco();
    setBanco(b);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (senhaInput === "lumosss") {
      setIsAuthenticated(true);
      setSenhaErro(false);
    } else {
      setSenhaErro(true);
      setSenhaInput("");
    }
  };

  const showNotificacao = (texto: string, sucesso: boolean) => {
    setNotificacao({ texto, sucesso });
    setTimeout(() => setNotificacao(null), 3000);
  };

  const adicionarPalavra = () => {
    const palavra = inputPalavra.trim().toUpperCase().replace(/\s/g, "");
    if (!palavra) {
      showNotificacao("Digite uma palavra primeiro!", false);
      return;
    }
    const [min, max] = FAIXA[modoAdicionar];
    if (palavra.length < min || palavra.length > max) {
      showNotificacao(`Modo ${MODO_CFG[modoAdicionar].label} aceita ${min === max ? `${min}` : `${min}-${max}`} letras!`, false);
      return;
    }
    const todas = [...banco.facil, ...banco.medio, ...banco.dificil];
    if (todas.includes(palavra)) {
      showNotificacao("Esta palavra já existe no grimório!", false);
      return;
    }
    const novo = { ...banco, [modoAdicionar]: [...banco[modoAdicionar], palavra] };
    setBanco(novo);
    salvarBanco(novo);
    setInputPalavra("");
    setAbaAtiva(modoAdicionar);
    showNotificacao(`"${palavra}" adicionado em ${MODO_CFG[modoAdicionar].label}!`, true);
  };

  const removerPalavra = (modo: Modo, palavra: string) => {
    const novo = { ...banco, [modo]: banco[modo].filter(p => p !== palavra) };
    setBanco(novo);
    salvarBanco(novo);
    showNotificacao(`"${palavra}" removido!`, true);
  };

  const palavrasFiltradas = banco[abaAtiva].filter(p =>
    p.includes(busca.toUpperCase())
  );

  const totalGeral = banco.facil.length + banco.medio.length + banco.dificil.length;

  // ── TELA DE LOGIN ───────────────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div
          className="bg-[var(--cor-fundo-painel)] border-2 border-[var(--cor-borda)] rounded-xl p-8 w-[340px] flex flex-col items-center gap-6"
          style={{ boxShadow: "0 0 40px rgba(13, 10, 26, 0.8)" }}
        >
          <div className="text-center">
            <span className="text-3xl mb-2 block">🔒</span>
            <h2 className="font-['Georgia'] text-lg uppercase tracking-[2px]" style={{ color: "var(--cor-texto)" }}>Área Restrita</h2>
            <p className="text-xs mt-1" style={{ color: "var(--cor-texto-suave)" }}>Insira a senha do Grimório</p>
          </div>
          <form onSubmit={handleLogin} className="w-full flex flex-col gap-3">
            <input
              type="password"
              value={senhaInput}
              onChange={e => setSenhaInput(e.target.value)}
              className={`w-full p-3 bg-[var(--cor-fundo)] border ${senhaErro ? "border-[#8b2020]" : "border-[var(--cor-borda)]"} rounded-lg text-[var(--cor-texto)] text-center tracking-[4px] outline-none focus:border-[var(--cor-dourado)] transition-colors`}
              placeholder="•••••••"
              autoFocus
            />
            {senhaErro && <p className="text-[#e07070] text-[11px] text-center">Senha incorreta. Tente novamente.</p>}
            <button type="submit" className="w-full mt-2 p-3 font-bold rounded-lg transition-colors tracking-[1px] cursor-pointer"
              style={{ background: "var(--cor-dourado)", color: "#0d0a1a" }}
              onMouseEnter={e => (e.currentTarget.style.background = "var(--cor-dourado-hover)")}
              onMouseLeave={e => (e.currentTarget.style.background = "var(--cor-dourado)")}>
              Acessar
            </button>
          </form>
          <Link to="/" className="text-xs transition-colors" style={{ color: "var(--cor-texto-suave)" }}
            onMouseEnter={e => (e.currentTarget.style.color = "var(--cor-dourado)")}
            onMouseLeave={e => (e.currentTarget.style.color = "var(--cor-texto-suave)")}>
            ← Voltar ao jogo
          </Link>
        </div>
      </div>
    );
  }

  // ── PAINEL ADMIN ────────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div
        className="flex flex-col bg-[var(--cor-fundo-painel)] border-2 border-[var(--cor-dourado)] rounded-2xl overflow-hidden"
        style={{ width: 740, maxHeight: "90vh", boxShadow: "0 0 60px rgba(212, 160, 23, 0.3)" }}
      >
        {/* Header */}
        <div className="flex justify-between items-center px-5 py-3.5 border-b shrink-0"
          style={{ background: "var(--cor-fundo)", borderColor: "var(--cor-borda)" }}>
          <span className="font-bold uppercase tracking-[3px] text-[15px]" style={{ color: "var(--cor-dourado)" }}>
            ⚡ Grimório de Palavras — Admin
          </span>
          <div className="flex items-center gap-3">
            <span className="text-xs px-2.5 py-1 rounded-full border" style={{ color: "var(--cor-texto-suave)", borderColor: "var(--cor-borda)" }}>
              {totalGeral} palavras no total
            </span>
            <Link to="/" className="flex items-center justify-center w-[28px] h-[28px] rounded-full border transition-all"
              style={{ borderColor: "var(--cor-borda)", color: "var(--cor-texto-suave)" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--cor-dourado)"; e.currentTarget.style.color = "var(--cor-dourado)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--cor-borda)"; e.currentTarget.style.color = "var(--cor-texto-suave)"; }}>
              ✕
            </Link>
          </div>
        </div>

        {/* Corpo: sidebar + conteúdo */}
        <div className="flex flex-1 min-h-0">

          {/* ── SIDEBAR ESQUERDA ─────────────────────────────────────── */}
          <div className="w-[250px] shrink-0 flex flex-col gap-4 p-4 border-r overflow-y-auto"
            style={{ borderColor: "var(--cor-borda)" }}>

            {/* Adicionar palavra */}
            <div>
              <p className="text-[10px] tracking-[2px] uppercase mb-2.5" style={{ color: "var(--cor-texto-suave)" }}>✦ Inscrever Feitiço</p>

              <input
                type="text"
                className="w-full p-2.5 rounded-lg text-[14px] uppercase tracking-[2px] outline-none transition-colors border"
                style={{ background: "var(--cor-fundo)", borderColor: "var(--cor-borda)", color: "var(--cor-texto)" }}
                placeholder="PALAVRA"
                maxLength={12}
                value={inputPalavra}
                onChange={e => setInputPalavra(e.target.value)}
                onKeyDown={e => e.key === "Enter" && adicionarPalavra()}
                onFocus={e => (e.target.style.borderColor = "var(--cor-dourado)")}
                onBlur={e => (e.target.style.borderColor = "var(--cor-borda)")}
              />

              {/* Seletor de dificuldade */}
              <p className="text-[10px] tracking-[2px] uppercase mt-3 mb-2" style={{ color: "var(--cor-texto-suave)" }}>Adicionar em:</p>
              <div className="flex flex-col gap-1.5">
                {(Object.keys(MODO_CFG) as Modo[]).map(m => {
                  const { label, emoji, letrasDica, cor } = MODO_CFG[m];
                  const ativo = modoAdicionar === m;
                  return (
                    <button
                      key={m}
                      onClick={() => setModoAdicionar(m)}
                      className="w-full flex items-center gap-2 p-2.5 rounded-lg border-2 text-left transition-all cursor-pointer"
                      style={{
                        background: ativo ? cor.bg : "transparent",
                        borderColor: ativo ? cor.border : "var(--cor-borda)",
                        color: ativo ? cor.text : "var(--cor-texto-suave)",
                      }}
                    >
                      <span className="text-base">{emoji}</span>
                      <div>
                        <p className="text-[12px] font-bold leading-tight">{label}</p>
                        <p className="text-[10px] opacity-70">{letrasDica}</p>
                      </div>
                      {ativo && <span className="ml-auto text-xs">✓</span>}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={adicionarPalavra}
                className="w-full mt-3 py-2.5 rounded-lg font-bold text-[13px] tracking-[1px] cursor-pointer border-none transition-all"
                style={{ background: "var(--cor-correto)", color: "#fff" }}
                onMouseEnter={e => (e.currentTarget.style.filter = "brightness(1.2)")}
                onMouseLeave={e => (e.currentTarget.style.filter = "brightness(1)")}
              >
                + Inscrever Feitiço
              </button>
            </div>

            {/* Notificação */}
            {notificacao && (
              <div className="p-2.5 rounded-lg text-[12px] text-center border"
                style={{
                  background: notificacao.sucesso ? "rgba(58,125,68,0.2)" : "rgba(139,32,32,0.2)",
                  color: notificacao.sucesso ? "#70c080" : "#e07070",
                  borderColor: notificacao.sucesso ? "#3a7d44" : "#8b2020",
                }}>
                {notificacao.texto}
              </div>
            )}
          </div>

          {/* ── PAINEL DIREITO ────────────────────────────────────────── */}
          <div className="flex-1 flex flex-col min-h-0">

            {/* Abas de dificuldade */}
            <div className="flex border-b shrink-0" style={{ borderColor: "var(--cor-borda)" }}>
              {(Object.keys(MODO_CFG) as Modo[]).map(m => {
                const { label, emoji, cor } = MODO_CFG[m];
                const ativo = abaAtiva === m;
                return (
                  <button
                    key={m}
                    onClick={() => { setAbaAtiva(m); setBusca(""); }}
                    className="flex-1 py-3 flex flex-col items-center gap-0.5 cursor-pointer transition-all border-b-2"
                    style={{
                      background: ativo ? cor.bg : "transparent",
                      borderBottomColor: ativo ? cor.border : "transparent",
                      color: ativo ? cor.text : "var(--cor-texto-suave)",
                    }}
                  >
                    <span className="text-base">{emoji} {label}</span>
                    <span className="text-[10px] opacity-70">{banco[m].length} palavras</span>
                  </button>
                );
              })}
            </div>

            {/* Busca */}
            <div className="px-4 pt-3 shrink-0">
              <input
                type="text"
                className="w-full p-2 rounded-lg text-[13px] uppercase outline-none border transition-colors"
                style={{ background: "var(--cor-fundo)", borderColor: "var(--cor-borda)", color: "var(--cor-texto)" }}
                placeholder="🔍 Buscar palavra..."
                value={busca}
                onChange={e => setBusca(e.target.value)}
                onFocus={e => (e.target.style.borderColor = "var(--cor-dourado)")}
                onBlur={e => (e.target.style.borderColor = "var(--cor-borda)")}
              />
            </div>

            {/* Grade de palavras */}
            <div className="flex-1 overflow-y-auto p-4">
              {palavrasFiltradas.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-[13px]" style={{ color: "var(--cor-texto-suave)" }}>
                    {busca ? "Nenhuma palavra encontrada." : "Nenhuma palavra cadastrada neste modo."}
                  </p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2 content-start">
                  {palavrasFiltradas.map(p => {
                    const cor = MODO_CFG[abaAtiva].cor;
                    return (
                      <div
                        key={p}
                        className="group flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[12px] tracking-[2px] uppercase transition-all"
                        style={{ background: "var(--cor-fundo)", borderColor: "var(--cor-borda)", color: "var(--cor-texto)" }}
                        onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = cor.border; (e.currentTarget as HTMLDivElement).style.color = cor.text; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "var(--cor-borda)"; (e.currentTarget as HTMLDivElement).style.color = "var(--cor-texto)"; }}
                      >
                        {p}
                        <button
                          onClick={() => removerPalavra(abaAtiva, p)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer ml-0.5 text-[#e07070] hover:text-[#ff6060] text-xs font-bold leading-none"
                          title="Remover"
                        >
                          ✕
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
