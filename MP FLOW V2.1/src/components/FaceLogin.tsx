import { useEffect, useRef, useState } from 'react';
import { ScanFace } from 'lucide-react';
import Modal from './Modal';
import { useAuth } from '../AuthContext';
import { loadApi, erroCamera } from './FaceGate';

type FaceApi = typeof import('@vladmandic/face-api');

// Login por ID facial: a câmera lê o rosto e o servidor descobre quem é e já entra no setor da pessoa.
function Inner({ onClose }: { onClose: () => void }) {
  const { signInFace } = useAuth();
  const [msg, setMsg] = useState('Solicitando acesso à câmera...');
  const [ok, setOk] = useState(false);
  const [negado, setNegado] = useState(false);
  const [falhou, setFalhou] = useState(false);
  const [tentativa, setTentativa] = useState(0);
  const video = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let stop = false;
    let stream: MediaStream | null = null;
    setFalhou(false);
    (async () => {
      try {
        if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
          setMsg('A câmera só funciona em endereço seguro (HTTPS) ou em localhost.');
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

        setMsg('Carregando reconhecimento facial...');
        let f: FaceApi;
        try {
          f = await loadApi();
        } catch {
          s.getTracks().forEach((t) => t.stop());
          setMsg('Não foi possível carregar o reconhecimento facial. Verifique a internet e toque em "Tentar de novo".');
          setFalhou(true);
          return;
        }
        if (stop) return;

        setMsg('Olhe para a câmera...');
        let falhas = 0;
        while (!stop) {
          const det = await f.detectSingleFace(v, new f.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptor();
          if (det && det.detection.score > 0.8) {
            const err = await signInFace(Array.from(det.descriptor));
            if (!err) { stop = true; setOk(true); setMsg('Identidade confirmada. Entrando...'); return; }
            falhas += 1;
            if (falhas >= 4) {
              stop = true; setNegado(true);
              setMsg(`${err} Use e-mail e senha para entrar.`);
              stream?.getTracks().forEach((t) => t.stop());
              return;
            }
            setMsg(`${err} (${falhas}/4)...`);
          }
          await new Promise((r) => setTimeout(r, 700));
        }
      } catch {
        setMsg('Ocorreu um erro ao usar a câmera. Toque em "Tentar de novo".');
        setFalhou(true);
      }
    })();
    return () => { stop = true; stream?.getTracks().forEach((t) => t.stop()); };
  }, [tentativa]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Modal open onClose={onClose} title="Entrar com ID facial">
      <div className="space-y-4">
        <div className={`relative rounded-2xl overflow-hidden bg-slate-900 aspect-video ring-4 ${ok ? 'ring-turquesa-400' : negado ? 'ring-rose-500' : 'ring-slate-300/60'}`}>
          <video ref={video} muted playsInline className="w-full h-full object-cover scale-x-[-1]" />
        </div>
        <p className={`text-sm flex items-center gap-2 ${ok ? 'text-turquesa-600' : negado || falhou ? 'text-rose-600 font-bold' : 'text-slate-600'}`}><ScanFace size={18} className="shrink-0" />{msg}</p>
        {falhou && !negado && <button onClick={() => setTentativa((n) => n + 1)} className="w-full py-2.5 rounded-xl text-sm font-semibold text-white bg-turquesa-500">Tentar de novo</button>}
        {negado && <button onClick={onClose} className="w-full py-2.5 rounded-xl text-sm font-semibold text-white bg-rose-500">Fechar</button>}
      </div>
    </Modal>
  );
}

export default function FaceLogin({ open, onClose }: { open: boolean; onClose: () => void }) {
  return open ? <Inner onClose={onClose} /> : null;
}
