import { useState } from 'react';
import { Search, Bell, Calendar } from 'lucide-react';
import Modal from './Modal';
import { useOP } from '../OPContext';

interface TopBarProps { title: string; subtitle: string }

export default function TopBar({ title, subtitle }: TopBarProps) {
  const { notificacoes } = useOP();
  const [open, setOpen] = useState(false);
  const [seen, setSeen] = useState(0);
  const unread = Math.max(0, notificacoes.length - seen);
  const today = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">{title}</h2>
        <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>
      </div>
      <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
        <div className="glass rounded-xl px-3 sm:px-4 py-2.5 flex items-center gap-2.5 text-sm text-slate-500">
          <Search size={16} />
          <input type="text" placeholder="Pesquisar..." className="bg-transparent outline-none text-slate-700 placeholder:text-slate-400 w-24 sm:w-36" />
        </div>
        <div className="glass rounded-xl px-3 sm:px-4 py-2.5 hidden sm:flex items-center gap-2 text-sm text-slate-600">
          <Calendar size={16} className="text-slate-400" />
          <span className="capitalize hidden md:inline">{today}</span>
        </div>
        <button aria-label="Notificações" onClick={() => { setOpen(true); setSeen(notificacoes.length); }} className="glass rounded-xl w-11 h-11 flex items-center justify-center text-slate-600 hover:bg-white/60 relative">
          <Bell size={18} />
          {unread > 0 && <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">{unread > 99 ? '99+' : unread}</span>}
        </button>
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title="Histórico de notificações" maxWidth="max-w-xl">
        <ul className="space-y-2 max-h-[60vh] overflow-y-auto">
          {notificacoes.map((n) => (
            <li key={n.id} className="glass-subtle rounded-xl px-4 py-3">
              <p className="text-sm text-slate-700">{n.mensagem}</p>
              <p className="text-[11px] text-slate-400 mt-1">{n.usuario} · {new Date(n.created_at).toLocaleString('pt-BR')}</p>
            </li>
          ))}
          {notificacoes.length === 0 && <li className="text-sm text-slate-400 text-center py-6">Nenhuma notificação ainda.</li>}
        </ul>
      </Modal>
    </div>
  );
}
