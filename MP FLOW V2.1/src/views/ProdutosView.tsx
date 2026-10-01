import { useState } from 'react';
import { Plus, Pencil, Trash2, FileSpreadsheet } from 'lucide-react';
import { useOP } from '../OPContext';
import GlassCard from '../components/GlassCard';
import Modal from '../components/Modal';

const input = 'w-full glass-subtle rounded-xl px-4 py-3 text-slate-700 outline-none focus:ring-2 focus:ring-marinho-400/40';
const vazio = { nome: '', categoria: '', embalagem: '' };

export default function ProdutosView() {
  const { produtos, saveProduto, deleteProduto, importarExcel } = useOP();
  const [form, setForm] = useState<(typeof vazio & { id?: string }) | null>(null);
  const [aviso, setAviso] = useState('');

  const salvar = async () => {
    if (!form || !form.nome.trim() || !form.categoria.trim() || !form.embalagem.trim()) return;
    await saveProduto(form);
    setForm(null);
  };
  const importar = async () => {
    const n = await importarExcel();
    setAviso(n ? `${n} produtos importados do Excel.` : 'Todos os produtos do Excel já estão cadastrados.');
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex justify-end gap-3 flex-wrap">
        <button onClick={importar} className="glass-strong rounded-xl px-5 py-2.5 flex items-center gap-2 text-sm font-semibold text-turquesa-700">
          <FileSpreadsheet size={18} /> Carregar produtos do Excel
        </button>
        <button onClick={() => setForm({ ...vazio })} className="glass-strong rounded-xl px-5 py-2.5 flex items-center gap-2 text-sm font-semibold text-marinho-600">
          <Plus size={18} /> Novo produto
        </button>
      </div>
      {aviso && <p className="text-sm text-slate-600">{aviso}</p>}
      <GlassCard strong className="p-5">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200/60 text-left text-xs font-semibold text-slate-500">
                <th className="px-4 py-3">Produto</th><th className="px-4 py-3">Categoria</th><th className="px-4 py-3">Embalagem / Apresentação</th><th className="px-4 py-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody>
              {produtos.map((p) => (
                <tr key={p.id} className="border-b border-slate-100/60 hover:bg-white/30">
                  <td className="px-4 py-3 font-medium text-slate-700">{p.nome}</td>
                  <td className="px-4 py-3 text-slate-600">{p.categoria}</td>
                  <td className="px-4 py-3 text-slate-600">{p.embalagem}</td>
                  <td className="px-4 py-3 text-center whitespace-nowrap">
                    <button aria-label="Editar" onClick={() => setForm(p)} className="p-2 rounded-lg text-marinho-600 hover:bg-marinho-400/15"><Pencil size={16} /></button>
                    <button aria-label="Excluir" onClick={() => window.confirm(`Excluir "${p.nome}"?`) && deleteProduto(p.id)} className="p-2 rounded-lg text-rose-600 hover:bg-rose-400/15"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
              {produtos.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400">Nenhum produto. Cadastre um ou carregue os do Excel.</td></tr>}
            </tbody>
          </table>
        </div>
      </GlassCard>
      <Modal open={!!form} onClose={() => setForm(null)} title={form?.id ? 'Editar produto' : 'Novo produto'}>
        {form && (
          <div className="space-y-4">
            <input className={input} placeholder="Produto" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
            <input className={input} placeholder="Categoria" value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })} />
            <input className={input} placeholder="Embalagem / Apresentação" value={form.embalagem} onChange={(e) => setForm({ ...form, embalagem: e.target.value })} />
            <div className="flex justify-end gap-3">
              <button onClick={() => setForm(null)} className="px-4 py-2.5 rounded-xl text-sm text-slate-500">Cancelar</button>
              <button onClick={salvar} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-marinho-600 to-marinho-800">Salvar</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
