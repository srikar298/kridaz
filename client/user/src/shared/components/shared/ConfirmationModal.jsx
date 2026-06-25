import React from "react";
import { AlertTriangle, X } from "lucide-react";
import { Button } from "@kridaz/ui";


const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "danger",
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="relative w-full max-w-md bg-background border border-border rounded-[8px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
        {/* Top Glow */}
        <div
          className={`absolute top-0 left-0 w-full h-1 ${type === "danger" ? "bg-red-500" : "bg-primary"}`}
        />

        <div className="p-8">
          <div className="flex items-center justify-between mb-6">
            <div
              className={`w-12 h-12 rounded-[8px] flex items-center justify-center ${type === "danger" ? "bg-red-500/10 text-red-500" : "bg-primary/10 text-primary"}`}
            >
              <AlertTriangle size={24} />
            </div>
            <Button
              onClick={onClose}
              className="p-2 text-white/20 hover:text-white transition-colors"
            >
              <X size={20} />
            </Button>
          </div>

          <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-2">
            {title}
          </h3>
          <p className="text-gray-500 font-medium leading-relaxed">{message}</p>

          <div className="flex items-center gap-4 mt-10">
            <Button
              onClick={onClose}
              className="flex-1 py-4 px-6 rounded-[8px] border border-white/10 text-white font-bold uppercase tracking-widest text-xs hover:bg-white/5 transition-all"
            >
              {cancelText}
            </Button>
            <Button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`flex-1 py-4 px-6 rounded-[8px] font-black uppercase tracking-widest text-xs transition-all shadow-lg ${type === "danger" ? "bg-red-500 text-white shadow-red-500/20 hover:bg-red-600" : "bg-primary text-black shadow-[var(--primary)]/20 hover:bg-[#b8e600]"}`}
            >
              {confirmText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
