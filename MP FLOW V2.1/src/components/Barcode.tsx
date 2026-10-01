import { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

export default function Barcode({ code }: { code: string }) {
  const ref = useRef<SVGSVGElement>(null);
  useEffect(() => {
    if (ref.current) JsBarcode(ref.current, code, { format: 'CODE128', height: 36, fontSize: 12, margin: 0, background: 'transparent' });
  }, [code]);
  return <svg ref={ref} className="max-w-[200px]" />;
}
