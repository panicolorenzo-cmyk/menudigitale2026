import { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

interface QRCodeCanvasProps {
  value: string;
  label: string;
}

export function QRCodeCanvas({ value, label }: QRCodeCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!canvasRef.current) {
      return;
    }

    void QRCode.toCanvas(canvasRef.current, value, {
      width: 220,
      margin: 4,
      color: {
        dark: '#171410',
        light: '#f7efe4'
      }
    });
  }, [value]);

  return (
    <div className="rounded-2xl border border-white/10 bg-cream p-4 text-ink shadow-glow">
      <canvas ref={canvasRef} className="mx-auto h-[220px] w-[220px]" aria-label={label} />
      <p className="mt-3 break-all text-center text-xs font-semibold text-ink/70">{value}</p>
    </div>
  );
}
