import { useEffect, useRef, useState } from 'react';
import { ScanFace } from 'lucide-react';
import Modal from './Modal';
import { useAuth } from '../AuthContext';

const MODELS = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';
const LIMITE = 0.5; // distância máxima entre rostos (menor = mais rígido)

type FaceApi = typeof import('@vladmandic/face-api');

let api: Promise<FaceApi> | null = null;
export const loadApi = () => {
  if (!api) {
    api = (async () => {
      const f = await import('@vladmandic/face-api');
      await Promise.all([f.nets.tinyFaceDetector.loadFromUri(MODELS), f.nets.faceLandmark68Net.loadFromUri(MODELS), f.nets.faceRecognitionNet.loadFromUri(MODELS)]);
      return f;
    })();
    // se falhar (sem internet, CDN bloqueado), não guarda o erro: a próxima tentativa baixa de novo
    api.catch(() => { api = null; });
  }
  return api;
};

interface Props { open: boolean; onClose: () => void; onVerified: () => void; onDenied?: () => void; etapa?: string; forceEnroll?: boolean }

export function erroCamera(e: unknown): string {
  const n = (e as { name?: string })?.name;
  if (n === 'NotAllowedError' || n === 'SecurityError') return 'A câmera está bloqueada para este site. Clique no cadeado ao lado do endereço, mude "Câmera" para Permitir e toque em "Tentar de novo".';
  if (n === 'NotFoundError' || n === 'OverconstrainedError') return 'Nenhuma câmera foi encontrada neste aparelho.';
  if (n === 'NotReadableError') return 'A câmera está sendo usada por outro programa ou aba. Feche-o e toque em "Tentar de novo".';
  return 'Não foi possível acessar a câmera.';
}

function Inner({ onClose, onVerified, onDenied, etapa, forceEnroll }: Omit<Props, 'open'>) {
  const { profile, updateProfile } = useAuth();
  const [enroll] = useState(() => !!forceEnroll || !profile?.face);
  const [consent, setConsent] = useState(false);
  const [msg, setMsg] = useState('Solicitando acesso à câmera...');
  const [ok, setOk] = useState(false);
  const [negado, setNegado] = useState(false);
  const [falhou, setFalhou] = useState(false);
  const [tentativa, setTentativa] = useState(0);
  const video = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (enroll && !consent) return;
    let stop = false;
    let stream: MediaStream | null = null;
    setFalhou(false);
    (async () => {
      try {
        // 1) A câmera é pedida PRIMEIRO, assim o navegador mostra o aviso de permissão na hora.
        if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
          setMsg('A câmera só funciona em endereço seguro (HTTPS) ou em localhost. Abra o sistema por http://localhost:5000 ou pelo link https da hospedagem.');
          setFalhou(true);
          return;
        }
        setMsg('Solicitando acesso à câmera...');
        let s: MediaStream;
        try {
          s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
        } catch (e) {
          setMsg(erroCamera(e)); setFalhou(true);
          return;
        }
        stream = s;
        if (stop) { s.getTracks().forEach((t) => t.stop()); return; }
        const v = video.current!;
        v.srcObject = s;
        await v.play();

        // 2) Só depois baixa os modelos de reconhecimento facial.
        setMsg('Carregando reconhecimento facial...');
        let f: FaceApi;
        try {
          f = await loadApi();
        } catch {
          s.getTracks().forEach((t) => t.stop());
          setMsg('Não foi possível carregar o reconhecimento facial. Verifique a internet (os modelos vêm do cdn.jsdelivr.net) e toque em "Tentar de novo".');
          setFalhou(true);
          return;
        }
        if (stop) return;

        setMsg('Olhe para a câmera...');
        let falhas = 0;
        while (!stop) {
          const det = await f.detectSingleFace(v, new f.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptor();
          if (det && det.detection.score > 0.8 && profile) {
            if (enroll) {
              const c = document.createElement('canvas');
              c.width = 160; c.height = 120;
              c.getContext('2d')?.drawImage(v, 0, 0, 160, 120);
              const err = await updateProfile({ ...profile, face: Array.from(det.descriptor), foto: c.toDataURL('image/jpeg', 0.6) });
              if (err) { setMsg(err); setFalhou(true); return; }
              stop = true; setOk(true); setMsg('Rosto cadastrado com sucesso.');
              setTimeout(onVerified, 700);
              return;
            }
            const d = f.euclideanDistance(det.descriptor, Float32Array.from(profile.face!));
            if (d < LIMITE) { stop = true; setOk(true); setMsg(`Identidade confirmada: ${profile.nome}`); setTimeout(onVerified, 700); return; }
            falhas += 1;
            if (falhas >= 4) {
              stop = true; setNegado(true);
              setMsg('ACESSO NEGADO: este rosto não confere com a conta logada. A etapa não foi iniciada.');
              stream?.getTracks().forEach((t) => t.stop());
              onDenied?.();
              return;
            }
            setMsg(`Rosto não reconhecido (${falhas}/4)...`);
          }
          await new Promise((r) => setTimeout(r, 700));
        }
      } catch {
        setMsg('Ocorreu um erro ao usar a câmera. Toque em "Tentar de novo".');
        setFalhou(true);
      }
    })();
    return () => { stop = true; stream?.getTracks().forEach((t) => t.stop()); };
  }, [enroll, consent, tentativa]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Modal open onClose={onClose} title={enroll ? 'Cadastrar rosto' : `Face ID${etapa ? ` — ${etapa}` : ''}`}>
      <div className="space-y-4">
        {enroll && !consent ? (
          <label className="flex items-start gap-3 text-sm text-slate-600">
            <input type="checkbox" className="mt-1" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
            Autorizo o uso da câmera e o armazenamento da assinatura numérica do meu rosto (não é foto) para confirmar minha identidade neste sistema.
          </label>
        ) : (
          <>
            <div className={`relative rounded-2xl overflow-hidden bg-slate-900 aspect-video ring-4 ${ok ? 'ring-turquesa-400' : negado ? 'ring-rose-500' : 'ring-slate-300/60'}`}>
              <video ref={video} muted playsInline className="w-full h-full object-cover scale-x-[-1]" />
            </div>
            <p className={`text-sm flex items-center gap-2 ${ok ? 'text-turquesa-600' : negado || falhou ? 'text-rose-600 font-bold' : 'text-slate-600'}`}><ScanFace size={18} className="shrink-0" />{msg}</p>
            {falhou && !negado && <button onClick={() => setTentativa((n) => n + 1)} className="w-full py-2.5 rounded-xl text-sm font-semibold text-white bg-turquesa-500">Tentar de novo</button>}
            {negado && <button onClick={onClose} className="w-full py-2.5 rounded-xl text-sm font-semibold text-white bg-rose-500">Fechar</button>}
          </>
        )}
      </div>
    </Modal>
  );
}

export default function FaceGate(p: Props) {
  return p.open ? <Inner {...p} /> : null;
}
