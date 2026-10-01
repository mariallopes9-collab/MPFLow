import * as Icons from 'lucide-react';
import { useState } from 'react';
import { LogOut, Menu, X } from 'lucide-react';
import { useOP } from '../OPContext';
import { useAuth } from '../AuthContext';
import ProfileModal from './ProfileModal';

export type SectionId = 'dashboard' | 'fabrica' | 'equipe' | 'produtos' | 'qualidade' | 'verificacao' | 'envase' | 'laboratorio';

interface NavEntry {
  id: SectionId;
  label: string;
  icon: string;
}

const NAV: NavEntry[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
  { id: 'fabrica', label: 'Fábrica Viva', icon: 'Radar' },
  { id: 'equipe', label: 'Equipe', icon: 'Users' },
  { id: 'produtos', label: 'Produtos', icon: 'Package' },
  { id: 'qualidade', label: '1. Qualidade', icon: 'ClipboardCheck' },
  { id: 'verificacao', label: '2. Verificação', icon: 'ShieldCheck' },
  { id: 'envase', label: '3. Envase', icon: 'Factory' },
  { id: 'laboratorio', label: '4. Laboratório', icon: 'Microscope' },
];

export const ACCESS: Record<string, SectionId[]> = {
  Gerente: ['dashboard', 'fabrica', 'equipe', 'produtos', 'qualidade', 'verificacao', 'envase', 'laboratorio'],
  Qualidade: ['qualidade'],
  Verificação: ['verificacao'],
  Envase: ['envase'],
  Laboratório: ['laboratorio'],
};

interface SidebarProps {
  active: SectionId;
  onSelect: (id: SectionId) => void;
}

export default function Sidebar({ active, onSelect }: SidebarProps) {
  const { ops, currentUser } = useOP();
  const { signOut } = useAuth();
  const [perfil, setPerfil] = useState(false);
  const [menu, setMenu] = useState(false);

  const badgeCount = (id: SectionId): number => {
    const st: Partial<Record<SectionId, string>> = { qualidade: 'Pedido', verificacao: 'Verificação', envase: 'Envase', laboratorio: 'Laboratório' };
    return st[id] ? ops.filter((op) => op.status_atual === st[id]).length : 0;
  };
  const allowed = ACCESS[currentUser.role] ?? [];

  return (
    <>
    <button aria-label="Abrir menu" onClick={() => setMenu(true)} className="lg:hidden fixed top-3 left-3 z-30 glass-strong rounded-xl w-11 h-11 flex items-center justify-center text-slate-700"><Menu size={20} /></button>
    {menu && <div className="lg:hidden fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-sm" onClick={() => setMenu(false)} />}
    <aside className={`w-64 max-w-[85vw] flex-shrink-0 h-screen p-4 fixed lg:sticky top-0 left-0 z-50 lg:z-auto transition-transform duration-300 ${menu ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
      <div className="aero-nav glass-strong rounded-2xl h-full flex flex-col p-5 overflow-y-auto relative">
        <button aria-label="Fechar menu" onClick={() => setMenu(false)} className="lg:hidden absolute top-3 right-3 p-2 rounded-lg text-slate-500 hover:bg-white/50"><X size={18} /></button>
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8 px-1">
          <div className="w-11 h-11 rounded-xl bg-white/80 flex items-center justify-center shadow-lg overflow-hidden border border-white/60">
            <img src="/image.png" alt="MP FLOW" className="w-full h-full object-cover" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800 tracking-tight">MP FLOW</h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest">Multiperfil ERP</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="aero-nav flex flex-col gap-1.5 flex-1">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest px-3 mb-1">
            Módulos
          </p>
          {NAV.filter((n) => allowed.includes(n.id)).map((item) => {
            const Icon = (Icons[item.icon as keyof typeof Icons] ?? Icons.Circle) as Icons.LucideIcon;
            const isActive = active === item.id;
            const count = badgeCount(item.id);
            return (
              <button
                key={item.id}
                onClick={() => { onSelect(item.id); setMenu(false); }}
                className={`aero-item px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
                  isActive ? 'aero-item-active' : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                <Icon size={18} className={`aero-icon ${isActive ? 'text-marinho-600' : 'text-slate-500'}`} />
                <span className="aero-label">{item.label}</span>
                {count > 0 && (
                  <span className={`aero-badge ${isActive ? 'aero-badge-on' : 'aero-badge-idle'}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="glass-subtle rounded-xl p-3 flex items-center gap-3">
          <button onClick={() => setPerfil(true)} className="flex items-center gap-3 min-w-0 flex-1 text-left" title="Editar perfil">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-turquesa-400 to-turquesa-500 flex items-center justify-center text-white text-xs font-bold shadow-sm">
            {currentUser.name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .slice(0, 2)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-700 truncate">{currentUser.name}</p>
            <p className="text-[11px] text-slate-500 truncate">{currentUser.role}</p>
          </div>
          </button>
          <button aria-label="Sair" onClick={signOut} className="p-2 rounded-lg text-slate-500 hover:bg-white/50"><LogOut size={16} /></button>
        </div>
      </div>
      <ProfileModal key={String(perfil)} open={perfil} onClose={() => setPerfil(false)} />
    </aside>
    </>
  );
}
