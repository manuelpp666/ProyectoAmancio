import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning';
}

export const ConfirmModal = ({
    isOpen, onClose, onConfirm, title, message,
    confirmText = "Confirmar", cancelText = "Cancelar", type = 'danger'
}: ConfirmModalProps) => {
    const [mounted, setMounted] = useState(false);

    // useEffect asegura que el portal solo se intente renderizar en el cliente
    useEffect(() => {
        setMounted(true);
    }, []);

    // Cerrar con la tecla Escape para mayor accesibilidad
    useEffect(() => {
        if (!isOpen) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [isOpen, onClose]);

    if (!isOpen || !mounted) return null;

    const estilo = {
        danger: {
            boton: "bg-[#701C32] hover:bg-[#5a1628] focus:ring-[#701C32]/40",
            circulo: "bg-[#701C32]/10 text-[#701C32]",
            icono: "report",
        },
        warning: {
            boton: "bg-[#093E7A] hover:bg-[#072d5a] focus:ring-[#093E7A]/40",
            circulo: "bg-[#093E7A]/10 text-[#093E7A]",
            icono: "warning",
        },
    }[type];

    return createPortal(
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={onClose}
        >
            <div
                role="alertdialog"
                aria-modal="true"
                className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-7 flex flex-col items-center text-center">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${estilo.circulo}`}>
                        <span className="material-symbols-outlined" style={{ fontSize: 34 }}>{estilo.icono}</span>
                    </div>
                    <h3 className="text-xl font-black text-gray-900 mb-2">{title}</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">{message}</p>
                </div>
                <div className="bg-gray-50 px-6 py-4 flex flex-col-reverse sm:flex-row justify-center gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 text-sm font-bold text-gray-700 bg-white border border-gray-200 hover:bg-gray-100 rounded-xl transition-colors"
                    >
                        {cancelText}
                    </button>
                    <button
                        autoFocus
                        onClick={() => { onConfirm(); onClose(); }}
                        className={`px-6 py-2.5 text-sm font-bold text-white rounded-xl transition-all shadow-md outline-none focus:ring-4 ${estilo.boton}`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};
