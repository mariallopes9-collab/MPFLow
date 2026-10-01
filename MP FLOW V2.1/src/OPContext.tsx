import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from 'react';
import type { ProducaoOP } from './types';
import { SEED_OPS } from './seed';
import { api } from './api';
import { useAuth } from './AuthContext';
import { PRODUTOS_EXCEL, type Produto } from './produtosExcel';

export interface Notificacao { id: string; mensagem: string; usuario: string | null; created_at: string }

interface OPContextValue {
  ops: ProducaoOP[];
  currentUser: { name: string; role: string };
  produtos: Produto[];
  notificacoes: Notificacao[];
  nextOPNumber: number;
  saveOP: (op: ProducaoOP, msg?: string) => void;
  toggleCheck: (id: string, key: string) => void;
  notify: (msg: string) => void;
  saveProduto: (p: Omit<Produto, 'id'> & { id?: string }) => Promise<void>;
  deleteProduto: (id: string) => Promise<void>;
  importarExcel: () => Promise<number>;
}

const OPContext = createContext<OPContextValue | null>(null);

export function OPProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth();
  const user = { name: profile?.nome ?? 'Usuário', role: profile?.cargo ?? 'Qualidade' };
  const [ops, setOps] = useState<ProducaoOP[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const ref = useRef<ProducaoOP[]>([]);
  const setAll = (list: ProducaoOP[]) => { ref.current = list; setOps(list); };

  const loadProdutos = async () => {
    setProdutos(await api<Produto[]>('/produtos'));
  };

  useEffect(() => {
    (async () => {
      let list = await api<ProducaoOP[]>('/ops');
      if (list.length === 0) { await api('/ops/bulk', { method: 'POST', body: SEED_OPS }); list = SEED_OPS; }
      setAll(list);
      await loadProdutos();
      setNotificacoes(await api<Notificacao[]>('/notificacoes'));
    })();
  }, []);

  const notify = useCallback(async (mensagem: string) => {
    try { const n = await api<Notificacao>('/notificacoes', { method: 'POST', body: { mensagem } }); setNotificacoes((prev) => [n, ...prev]); } catch (e) { console.error(e); }
  }, []);

  const nextOPNumber = ops.length ? Math.max(...ops.map((o) => parseInt(o.id_op.replace('OP-', ''), 10))) + 1 : 2401;

  const saveOP = (op: ProducaoOP, msg?: string) => {
    const exists = ref.current.some((o) => o.id_op === op.id_op);
    setAll(exists ? ref.current.map((o) => (o.id_op === op.id_op ? op : o)) : [...ref.current, op]);
    api(`/ops/${op.id_op}`, { method: 'PUT', body: op }).catch(console.error);
    if (msg) notify(msg);
  };

  const toggleCheck = (id: string, key: string) => {
    const cur = ref.current.find((o) => o.id_op === id);
    if (cur) saveOP({ ...cur, checklist: { ...(cur.checklist ?? {}), [key]: !(cur.checklist ?? {})[key] } });
  };

  const saveProduto = async (p: Omit<Produto, 'id'> & { id?: string }) => {
    const { id, ...rest } = p;
    await api(id ? `/produtos/${id}` : '/produtos', { method: id ? 'PUT' : 'POST', body: rest });
    await loadProdutos();
    notify(`Produto ${id ? 'editado' : 'cadastrado'}: ${p.nome}`);
  };
  const deleteProduto = async (id: string) => {
    const nome = produtos.find((x) => x.id === id)?.nome;
    await api(`/produtos/${id}`, { method: 'DELETE' });
    await loadProdutos();
    notify(`Produto excluído: ${nome}`);
  };
  const importarExcel = async () => {
    const existentes = new Set(produtos.map((p) => p.nome.toLowerCase()));
    const novos = PRODUTOS_EXCEL.filter((p) => !existentes.has(p.nome.toLowerCase()));
    if (novos.length) { await api('/produtos', { method: 'POST', body: novos }); await loadProdutos(); notify(`${novos.length} produtos importados do Excel`); }
    return novos.length;
  };

  return (
    <OPContext.Provider value={{ ops, currentUser: user, produtos, notificacoes, nextOPNumber, saveOP, toggleCheck, notify, saveProduto, deleteProduto, importarExcel }}>
      {children}
    </OPContext.Provider>
  );
}

export function useOP(): OPContextValue {
  const ctx = useContext(OPContext);
  if (!ctx) throw new Error('useOP must be used within OPProvider');
  return ctx;
}
