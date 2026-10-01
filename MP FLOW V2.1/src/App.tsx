import { useEffect, useState } from 'react';
import { OPProvider } from './OPContext';
import { AuthProvider, useAuth } from './AuthContext';
import LoginView from './views/LoginView';
import ProdutosView from './views/ProdutosView';
import Sidebar, { type SectionId } from './components/Sidebar';
import TopBar from './components/TopBar';
import DashboardView from './views/DashboardView';
import FabricaVivaView from './views/FabricaVivaView';
import LaboratorioView from './views/LaboratorioView';
import QualidadeView from './views/QualidadeView';
import VerificacaoView from './views/VerificacaoView';
import EnvaseView from './views/EnvaseView';
import EquipeView from './views/EquipeView';
import PendingView from './views/PendingView';
import LoteView from './views/LoteView';
import { ACCESS } from './components/Sidebar';
import { BrandHeader, BrandFooter } from './components/BrandBar';

const SUBTITLES: Record<SectionId, string> = {
  dashboard: 'Visão gerencial: indicadores, eficiência de bombas e prejuízo oculto',
  fabrica: 'Fluxo dos lotes, risco da receita, atrasos e custo das perdas em R$',
  equipe: 'Aprove os acessos e defina o cargo de cada funcionário',
  produtos: 'Cadastro de produtos da Multiperfil: adicione, edite, exclua ou importe do Excel',
  qualidade: 'Digite o pedido, confira a disponibilidade dos materiais e resolva as pendências',
  verificacao: 'Verifique e aprove pH, densidades e placas antes de liberar para o envase',
  envase: 'Escolha a quantidade, registre início e fim e acompanhe o progresso',
  laboratorio: 'Confira mistura, envase e qualidade e dê o OK final no lote',
};
const TITLES: Record<SectionId, string> = {
  dashboard: 'Dashboard', fabrica: 'Fábrica Viva', equipe: 'Equipe', produtos: 'Produtos',
  qualidade: 'Etapa 1: Gestão de Qualidade', verificacao: 'Etapa 2: Verificação', envase: 'Etapa 3: Envase', laboratorio: 'Etapa 4: Laboratório',
};

function Shell() {
  const { profile } = useAuth();
  const allowed = ACCESS[profile?.cargo ?? ''] ?? [];
  const [sel, setSel] = useState<SectionId | null>(null);
  const active: SectionId = sel && allowed.includes(sel) ? sel : allowed[0];
  const [hash, setHash] = useState(window.location.hash);
  useEffect(() => {
    const f = () => setHash(window.location.hash);
    window.addEventListener('hashchange', f);
    return () => window.removeEventListener('hashchange', f);
  }, []);
  const loteId = hash.startsWith('#/lote/') ? decodeURIComponent(hash.slice(7)) : null;
  const go = (s: SectionId) => {
    if (window.location.hash) history.replaceState(null, '', window.location.pathname + window.location.search);
    setHash('');
    setSel(s);
  };

  const renderView = () => {
    switch (active) {
      case 'dashboard': return <DashboardView />;
      case 'fabrica': return <FabricaVivaView />;
      case 'equipe': return <EquipeView />;
      case 'produtos': return <ProdutosView />;
      case 'qualidade': return <QualidadeView />;
      case 'verificacao': return <VerificacaoView />;
      case 'envase': return <EnvaseView />;
      case 'laboratorio': return <LaboratorioView />;
      default: return null;
    }
  };

  return (
    <OPProvider>
      <div className="bg-orbs min-h-screen flex relative overflow-x-hidden">
        <Sidebar active={active} onSelect={go} />
        <main className="flex-1 min-w-0 p-4 pt-16 sm:p-6 sm:pt-16 lg:pt-6 overflow-y-auto relative z-10" style={{ maxHeight: '100vh' }}>
          <BrandHeader />
          <TopBar title={loteId ? `Lote ${loteId}` : TITLES[active]} subtitle={loteId ? 'Acompanhamento em tempo real da mistura e do envase' : SUBTITLES[active]} />
          {loteId ? <LoteView id={loteId} /> : renderView()}
          <footer className="mt-10 pt-4 border-t border-slate-300/50 text-xs text-slate-500 leading-relaxed">
            Protótipo feito pelos alunos: Maria Luiza Amorim, Felipe Vieira, Matheus Chagas, Julia Souza, Tayne Gardussi, participantes da equipe vermelha do Desafio de Ideias SENAI 2026, SENAI Nami Jafet, desafio Multiperfil
          </footer>
          <BrandFooter />
        </main>
      </div>
    </OPProvider>
  );
}

function Gate() {
  const { session, profile, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-500">Carregando...</div>;
  if (!session) return <LoginView />;
  if (!profile) return <div className="min-h-screen flex items-center justify-center text-slate-500">Carregando perfil...</div>;
  if (profile.status !== 'aprovado') return <PendingView />;
  return <Shell />;
}

export default function App() {
  return (
    <AuthProvider>
      <Gate />
    </AuthProvider>
  );
}
