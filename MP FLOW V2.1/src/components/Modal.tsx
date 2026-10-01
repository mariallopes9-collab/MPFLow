import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  maxWidth?: string;
}

export default function Modal({ open, onClose, title, children, maxWidth = 'max-w-lg' }: ModalProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-2 sm:p-4">
      <div
        className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      <div
        className={`relative glass-strong rounded-2xl shadow-2xl w-full ${maxWidth} animate-fade-in p-4 sm:p-6 max-h-[94vh] overflow-y-auto`}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-slate-800">{title}</h3>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-lg glass-subtle flex items-center justify-center text-slate-500 hover:bg-white/60 transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
