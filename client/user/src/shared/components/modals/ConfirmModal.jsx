import React from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@kridaz/ui";


const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  isDestructive = true,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div
        className="bg-card border border-white/10 rounded-[8px] w-full max-w-sm overflow-hidden shadow-2xl animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 flex items-start gap-4">
          <div
            className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${isDestructive ? "bg-red-500/10 text-red-500" : "bg-primary/10 text-primary"}`}
          >
            <AlertTriangle size={20} />
          </div>
          <div className="flex-1 pt-1">
            <h3 className="text-white font-bold text-lg leading-tight mb-1">
              {title}
            </h3>
            <p className="text-white/60 text-sm leading-relaxed">{message}</p>
          </div>
        </div>

        <div className="flex border-t border-white/5">
          <Button
            onClick={onClose}
            className="flex-1 py-3 text-sm font-semibold text-white/60 hover:text-white hover:bg-white/5 transition-colors border-r border-white/5"
          >
            {cancelText}
          </Button>
          <Button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`flex-1 py-3 text-sm font-bold transition-colors ${isDestructive ? "text-red-500 hover:bg-red-500/10 hover:text-red-400" : "text-primary hover:bg-primary/10 hover:text-[#a3f01b]"}`}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
