import { useEffect, useState } from 'react';
import * as QRCode from 'qrcode';

export const loteUrl = (id: string) => `${window.location.origin}${window.location.pathname}#/lote/${encodeURIComponent(id)}`;

export default function QRLote({ id, size = 96 }: { id: string; size?: number }) {
  const [src, setSrc] = useState('');
  useEffect(() => { QRCode.toDataURL(loteUrl(id), { margin: 1, width: 240 }).then(setSrc); }, [id]);
  if (!src) return null;
  return (
    <a href={loteUrl(id)} title="Escaneie para acompanhar o lote em tempo real" className="inline-block text-center">
      <img src={src} alt={`QR Code do lote ${id}`} style={{ width: size, height: size }} className="rounded-lg bg-white p-1" />
      <span className="block text-[10px] text-slate-500 mt-0.5">Acompanhar ao vivo</span>
    </a>
  );
}
