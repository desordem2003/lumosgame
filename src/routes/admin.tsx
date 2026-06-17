import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";

export const Route = createFileRoute("/admin")({
  component: Admin,
});

const DEFAULT_PALAVRAS = [
  "HARRY", "DRACO", "AVADA", "LUMOS", "ACCIO", "DOBBY", "PEDRA", "MANTO", "FELIX", "BRUXO", "SQUIB", "MAGIA", "SALAO"
];

function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [senhaInput, setSenhaInput] = useState("");
  const [senhaErro, setSenhaErro] = useState(false);

  const [palavras, setPalavras] = useState<string[]>([]);
  const [inputAdicionar, setInputAdicionar] = useState("");
  const [inputRemover, setInputRemover] = useState("");
  const [busca, setBusca] = useState("");
  const [notificacao, setNotificacao] = useState<{ texto: string; sucesso: boolean } | null>(null);

  useEffect(() => {
    const salvas = localStorage.getItem("lumos_palavras");
    if (salvas) {
      setPalavras(JSON.parse(salvas));
    } else {
      setPalavras(DEFAULT_PALAVRAS);
      localStorage.setItem("lumos_palavras", JSON.stringify(DEFAULT_PALAVRAS));
    }
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
    const palavra = inputAdicionar.trim().toUpperCase();
    if (!palavra) {
      showNotificacao("Digite uma palavra primeiro!", false);
      return;
    }
    if (palavra.length !== 5) {
      showNotificacao("A palavra deve ter 5 letras!", false);
      return;
    }
    if (palavras.includes(palavra)) {
      showNotificacao("Esta palavra já existe no grimório!", false);
      return;
    }

    const novas = [...palavras, palavra];
    setPalavras(novas);
    localStorage.setItem("lumos_palavras", JSON.stringify(novas));
    setInputAdicionar("");
    showNotificacao(`Feitiço '${palavra}' adicionado com sucesso!`, true);
  };

  const removerPalavra = () => {
    const palavra = inputRemover.trim().toUpperCase();
    if (!palavra) {
      showNotificacao("Digite ou selecione uma palavra!", false);
      return;
    }
    if (!palavras.includes(palavra)) {
      showNotificacao("Palavra não encontrada no grimório!", false);
      return;
    }

    const novas = palavras.filter(p => p !== palavra);
    setPalavras(novas);
    localStorage.setItem("lumos_palavras", JSON.stringify(novas));
    setInputRemover("");
    showNotificacao(`Feitiço '${palavra}' banido com sucesso!`, true);
  };

  const palavrasFiltradas = palavras.filter(p => p.includes(busca.toUpperCase()));

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="bg-[var(--cor-fundo-painel)] border-2 border-[var(--cor-borda)] rounded-xl p-8 w-[340px] flex flex-col items-center gap-6"
             style={{ boxShadow: '0 0 40px rgba(13, 10, 26, 0.8)' }}>
          <div className="text-center">
            <span className="text-3xl filter drop-shadow-md mb-2 block">🔒</span>
            <h2 className="text-[var(--cor-texto)] font-['Georgia'] text-lg uppercase tracking-[2px]">Área Restrita</h2>
            <p className="text-[var(--cor-texto-suave)] text-xs mt-1">Insira a senha do Grimório</p>
          </div>
          
          <form onSubmit={handleLogin} className="w-full flex flex-col gap-3">
            <input 
              type="password" 
              value={senhaInput}
              onChange={(e) => setSenhaInput(e.target.value)}
              className={`w-full p-3 bg-[var(--cor-fundo)] border ${senhaErro ? 'border-[#8b2020]' : 'border-[var(--cor-borda)]'} rounded-lg text-[var(--cor-texto)] text-center tracking-[4px] outline-none focus:border-[var(--cor-dourado)] transition-colors`}
              placeholder="•••••••"
              autoFocus
            />
            {senhaErro && <p className="text-[#e07070] text-[11px] text-center m-0">Senha incorreta. Tente novamente.</p>}
            
            <button 
              type="submit"
              className="w-full mt-2 p-3 bg-[var(--cor-dourado)] hover:bg-[var(--cor-dourado-hover)] text-[#0d0a1a] font-bold rounded-lg transition-colors tracking-[1px] cursor-pointer"
            >
              Acessar
            </button>
          </form>

          <Link to="/" className="text-[var(--cor-texto-suave)] text-xs hover:text-[var(--cor-dourado)] transition-colors">
            ← Voltar ao jogo
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div 
        className="flex flex-col bg-[var(--cor-fundo-painel)] border-2 border-[var(--cor-dourado)] rounded-2xl w-[700px] h-[560px] max-w-full overflow-hidden"
        style={{ boxShadow: '0 0 60px rgba(212, 160, 23, 0.3)' }}
      >
        <div className="flex justify-between items-center p-4 border-b border-[var(--cor-borda)] bg-[var(--cor-fundo)] shrink-0">
          <span className="text-[16px] text-[var(--cor-dourado)] tracking-[3px] font-variant-small-caps font-bold uppercase">
            ⚡ Grimório de Palavras — Admin
          </span>
          <Link to="/" className="flex items-center justify-center bg-transparent border border-[var(--cor-borda)] text-[var(--cor-texto-suave)] w-[30px] h-[30px] rounded-full text-[13px] transition-all hover:border-[var(--cor-dourado)] hover:text-[var(--cor-dourado)]">
            ✕
          </Link>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Painel de Controles */}
          <div className="w-[260px] shrink-0 p-4 border-r border-[var(--cor-borda)] flex flex-col gap-3 overflow-y-auto">
            
            <p className="text-[10px] tracking-[2px] uppercase text-[var(--cor-texto-suave)] mb-1">✦ Adicionar ao Grimório</p>
            <input 
              type="text" 
              className="w-full p-2.5 bg-[var(--cor-fundo)] border border-[var(--cor-borda)] rounded-lg text-[var(--cor-texto)] text-[14px] tracking-[2px] uppercase outline-none focus:border-[var(--cor-dourado)] transition-colors"
              placeholder="PALAVRA (5 letras)" 
              maxLength={5}
              value={inputAdicionar}
              onChange={e => setInputAdicionar(e.target.value)}
            />
            <button 
              onClick={adicionarPalavra}
              className="w-full p-2.5 rounded-lg text-[13px] font-bold cursor-pointer transition-all tracking-[1px] bg-[var(--cor-correto)] text-white hover:brightness-110 border-none"
            >
              + Inscrever Feitiço
            </button>

            <div className="h-[1px] bg-[var(--cor-borda)] my-1" />

            <p className="text-[10px] tracking-[2px] uppercase text-[var(--cor-texto-suave)] mb-1">✦ Remover do Grimório</p>
            <input 
              type="text" 
              className="w-full p-2.5 bg-[var(--cor-fundo)] border border-[var(--cor-borda)] rounded-lg text-[var(--cor-texto)] text-[14px] tracking-[2px] uppercase outline-none focus:border-[var(--cor-dourado)] transition-colors"
              placeholder="PALAVRA" 
              maxLength={5}
              value={inputRemover}
              onChange={e => setInputRemover(e.target.value)}
            />
            <button 
              onClick={removerPalavra}
              className="w-full p-2.5 rounded-lg text-[13px] font-bold cursor-pointer transition-all tracking-[1px] bg-transparent border border-[#8b2020] text-[#e07070] hover:bg-[#8b202033]"
            >
              − Banir Feitiço
            </button>

            <div className="h-[1px] bg-[var(--cor-borda)] my-1" />

            <div 
              className={`p-2 rounded-lg text-[12px] text-center min-h-[34px] flex items-center justify-center border transition-all ${
                notificacao 
                  ? notificacao.sucesso 
                    ? 'bg-[#3a7d4433] text-[#70c080] border-[var(--cor-correto)]' 
                    : 'bg-[#8b202033] text-[#e07070] border-[#8b2020]'
                  : 'bg-transparent border-transparent text-transparent'
              }`}
            >
              {notificacao ? notificacao.texto : ""}
            </div>
          </div>

          {/* Painel de Lista de Palavras */}
          <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-2">
            <div className="flex justify-between items-center mb-2">
              <p className="text-[10px] tracking-[2px] uppercase text-[var(--cor-texto-suave)] m-0">✦ Palavras cadastradas</p>
              <span className="text-[12px] text-[var(--cor-texto-suave)] bg-[rgba(212,160,23,0.1)] border border-[var(--cor-borda)] px-2.5 py-1 rounded-full">
                {palavras.length} palavras
              </span>
            </div>

            <input 
              type="text" 
              className="w-full p-2 bg-[var(--cor-fundo)] border border-[var(--cor-borda)] rounded-lg text-[var(--cor-texto)] text-[13px] outline-none focus:border-[var(--cor-dourado)] mb-2 uppercase"
              placeholder="🔍 Buscar palavra..." 
              value={busca}
              onChange={e => setBusca(e.target.value)}
            />

            <div className="flex flex-wrap gap-1.5 content-start">
              {palavrasFiltradas.map(p => (
                <div 
                  key={p} 
                  onClick={() => setInputRemover(p)}
                  className="bg-[var(--cor-fundo)] border border-[var(--cor-borda)] rounded-md px-2.5 py-1 text-[12px] tracking-[2px] text-[var(--cor-texto)] cursor-pointer uppercase transition-colors hover:border-[var(--cor-dourado)] hover:text-[var(--cor-dourado)]"
                >
                  {p}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
