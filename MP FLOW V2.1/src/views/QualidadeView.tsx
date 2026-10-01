import { useState } from 'react';
import { Plus, Trash2, ScanFace, Send, Save } from 'lucide-react';
import { useOP } from '../OPContext';
import FaceGate from '../components/FaceGate';
import Modal from '../components/Modal';
import { OPCard, Empty, inputCls, labelCls, btnPrimary, btnGhost } from '../components/StageCommon';
import { emptyOP, audit } from '../seed';
import type { ProducaoOP } from '../types';

export default function QualidadeView() {
  const { ops, produtos, currentUser, nextOPNumber, saveOP, notify } = useOP();
  const [after, setAfter] = useState<{ run: () => void } | null>(null);
  const [draft, setDraft] = useState<ProducaoOP | null>(null);
  const [novaPend, setNovaPend] = useState('');

  const lista = ops.filter((o) => o.status_atual === 'Pedido');
  const indisponiveis = draft?.materiais.filter((m) => !m.disponivel).length ?? 0;
  const pendOk = !!draft && draft.pendencias.length > 0 && draft.pendencias.every((p) => p.feito);
  const podeEnviar = !!draft && !!draft.produto && draft.quantidade_planejada > 0 && !!draft.prazo && draft.materiais.length > 0 && draft.materiais.every((m) => m.nome.trim()) && (indisponiveis === 0 || pendOk);

  const up = (patch: Partial<ProducaoOP>) => draft && setDraft({ ...draft, ...patch });
  const setMat = (i: number, patch: object) => draft && up({ materiais: draft.materiais.map((m, k) => (k === i ? { ...m, ...patch } : m)) });

  const abrir = (op: ProducaoOP | null) =>
    setAfter({ run: () => setDraft(op ? { ...op } : emptyOP(`OP-${nextOPNumber}`, '', 0, currentUser.name)) });

  const salvar = (enviar: boolean) => {
    if (!draft) return;
    const next: ProducaoOP = { ...draft, status_atual: enviar ? 'Verificação' : 'Pedido', auditoria: audit(draft, 'Qualidade', currentUser.name) };
    saveOP(next, enviar ? `${next.id_op}: pedido de ${next.produto} enviado para Verificação` : `${next.id_op}: rascunho do pedido salvo`);
    setDraft(null);
  };

  return (
    <div className="animate-fade-in space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-sm text-slate-500">{lista.length} pedido(s) em preparação. O Face ID é conferido antes de abrir cada pedido.</p>
        <button onClick={() => abrir(null)} className="glass-strong rounded-xl px-5 py-2.5 flex items-center gap-2 text-sm font-semibold text-marinho-600"><Plus size={18} /> Novo pedido</button>
      </div>
      {lista.length === 0 && <Empty text="Nenhum pedido em preparação." />}
      {lista.map((op) => (
        <OPCard key={op.id_op} op={op} actions={<button onClick={() => abrir(op)} className={btnPrimary}><ScanFace size={16} /> Abrir pedido</button>}>
          <p className="text-xs text-slate-500">{op.materiais.length} materiais · {op.materiais.filter((m) => !m.disponivel).length} indisponível(is)</p>
        </OPCard>
      ))}

      <FaceGate open={!!after} onDenied={() => notify('ACESSO NEGADO (Etapa 1: Pedido): rosto não confere com a conta logada')} etapa="Etapa 1: Pedido" onClose={() => setAfter(null)} onVerified={() => { after?.run(); setAfter(null); }} />

      <Modal open={!!draft} onClose={() => setDraft(null)} title={`Pedido ${draft?.id_op ?? ''}`} maxWidth="max-w-2xl">
        {draft && (
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-3">
                <label className={labelCls}>Produto</label>
                <select className={inputCls} value={draft.produto} onChange={(e) => up({ produto: e.target.value })}>
                  <option value="">Selecione...</option>
                  {produtos.map((p) => <option key={p.id} value={p.nome}>{p.nome} ({p.embalagem})</option>)}
                </select>
              </div>
              <div><label className={labelCls}>Quantidade (un)</label><input type="number" className={inputCls} value={draft.quantidade_planejada || ''} onChange={(e) => up({ quantidade_planejada: parseInt(e.target.value, 10) || 0 })} /></div>
              <div className="sm:col-span-2"><label className={labelCls}>Prazo de entrega</label><input type="datetime-local" className={inputCls} value={draft.prazo ?? ''} onChange={(e) => up({ prazo: e.target.value })} /></div>
            </div>

            <div>
              <label className={labelCls}>Materiais da receita e disponibilidade</label>
              <div className="space-y-2">
                {draft.materiais.map((m, i) => (
                  <div key={i} className="flex gap-2 items-center flex-wrap sm:flex-nowrap">
                    <input className={inputCls} placeholder="Material" value={m.nome} onChange={(e) => setMat(i, { nome: e.target.value })} />
                    <input className={`${inputCls} max-w-[110px]`} placeholder="Qtd." value={m.quantidade} onChange={(e) => setMat(i, { quantidade: e.target.value })} />
                    <label className="flex items-center gap-1.5 text-xs text-slate-600 whitespace-nowrap"><input type="checkbox" checked={m.disponivel} onChange={(e) => setMat(i, { disponivel: e.target.checked })} />Disponível</label>
                    <button aria-label="Remover" onClick={() => up({ materiais: draft.materiais.filter((_, k) => k !== i) })} className="p-2 text-rose-500"><Trash2 size={16} /></button>
                  </div>
                ))}
              </div>
              <button onClick={() => up({ materiais: [...draft.materiais, { nome: '', quantidade: '', disponivel: true }] })} className="mt-2 text-sm font-semibold text-marinho-600">+ Adicionar material</button>
            </div>

            {indisponiveis > 0 && (
              <div className="glass-subtle rounded-xl p-4">
                <p className="text-sm font-bold text-amber-700 mb-2">{indisponiveis} item(ns) indisponível(is): checklist de pendências</p>
                {draft.pendencias.map((p, i) => (
                  <div key={i} className="flex items-center gap-2 py-1">
                    <input type="checkbox" checked={p.feito} onChange={() => up({ pendencias: draft.pendencias.map((x, k) => (k === i ? { ...x, feito: !x.feito } : x)) })} />
                    <span className={`text-sm flex-1 ${p.feito ? 'line-through text-slate-400' : 'text-slate-700'}`}>{p.texto}</span>
                    <button aria-label="Remover" onClick={() => up({ pendencias: draft.pendencias.filter((_, k) => k !== i) })} className="text-rose-500"><Trash2 size={14} /></button>
                  </div>
                ))}
                <div className="flex gap-2 mt-2">
                  <input className={inputCls} placeholder="Nova tarefa pendente (ex.: solicitar compra)" value={novaPend} onChange={(e) => setNovaPend(e.target.value)} />
                  <button onClick={() => { if (novaPend.trim()) { up({ pendencias: [...draft.pendencias, { texto: novaPend.trim(), feito: false }] }); setNovaPend(''); } }} className="px-3 rounded-xl text-sm font-semibold text-marinho-600 bg-marinho-400/15">Adicionar</button>
                </div>
                {!pendOk && <p className="text-xs text-amber-600 mt-2">Só é possível enviar quando todas as pendências estiverem concluídas.</p>}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2 flex-wrap">
              <button onClick={() => setDraft(null)} className={btnGhost}>Cancelar</button>
              <button onClick={() => salvar(false)} disabled={!draft.produto} className={`${btnGhost} inline-flex items-center gap-2 border border-slate-300/60 disabled:opacity-40`}><Save size={16} /> Salvar rascunho</button>
              <button onClick={() => salvar(true)} disabled={!podeEnviar} className={btnPrimary}><Send size={16} /> Enviar para Verificação</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
