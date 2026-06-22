import React from "react";
import { AlertCircle, CheckCircle, XCircle, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";import { Button, Input } from "@kridaz/ui";


const ConfirmationPopup = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = "warning", // 'warning', 'success', 'danger'
  confirmText = "Confirm",
  cancelText = "Cancel",
  showGovernanceForm = false,
}) => {
  const [adminData, setAdminData] = React.useState({
    name: "",
    designation: "",
  });
  const [error, setError] = React.useState("");

  if (!isOpen) return null;

  const themes = {
    warning: {
      icon: AlertCircle,
      color: "text-yellow-500",
      bg: "bg-yellow-500/10",
      border: "border-yellow-500/20",
      btn: "bg-yellow-500 hover:bg-yellow-600 text-black",
    },
    danger: {
      icon: XCircle,
      color: "text-red-500",
      bg: "bg-red-500/10",
      border: "border-red-500/20",
      btn: "bg-red-500 hover:bg-red-600 text-white",
    },
    success: {
      icon: CheckCircle,
      color: "text-primary",
      bg: "bg-primary/10",
      border: "border-primary/20",
      btn: "bg-primary hover:bg-primary/80 text-black",
    },
  };

  const theme = themes[type] || themes.warning;
  const Icon = theme.icon;

  const handleConfirm = () => {
    if (showGovernanceForm && (!adminData.name || !adminData.designation)) {
      setError("Please provide all governance details");
      return;
    }
    onConfirm(adminData);
    onClose();
    setAdminData({ name: "", designation: "" });
    setError("");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-md bg-[#151617] border border-border rounded-[8px] p-8 shadow-2xl overflow-hidden"
          >
            {/* Ambient background glow */}
            <div
              className={`absolute top-0 right-0 w-32 h-32 ${theme.bg} blur-[60px] pointer-events-none`}
            />

            <div className="flex flex-col items-center text-center gap-6 relative z-10">
              <div
                className={`w-16 h-16 ${theme.bg} ${theme.border} border rounded-full flex items-center justify-center`}
              >
                <Icon className={`w-8 h-8 ${theme.color}`} />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white uppercase tracking-tight">
                  {title}
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  {message}
                </p>
              </div>

              {showGovernanceForm && (
                <div className="w-full space-y-4 text-left">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">
                      Admin Name
                    </label>
                    <Input
                      type="text"
                      value={adminData.name}
                      onChange={(e) =>
                        setAdminData({ ...adminData, name: e.target.value })
                      }
                      placeholder="Enter your full name"
                      className="w-full bg-white/5 border border-white/10 rounded-[8px] px-4 py-3 text-white text-sm focus:border-primary/50 outline-none transition-all placeholder:text-gray-600"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">
                      Designation
                    </label>
                    <Input
                      type="text"
                      value={adminData.designation}
                      onChange={(e) =>
                        setAdminData({
                          ...adminData,
                          designation: e.target.value,
                        })
                      }
                      placeholder="e.g. Platform Supervisor"
                      className="w-full bg-white/5 border border-white/10 rounded-[8px] px-4 py-3 text-white text-sm focus:border-primary/50 outline-none transition-all placeholder:text-gray-600"
                    />
                  </div>
                  {error && (
                    <p className="text-red-500 text-[10px] font-bold uppercase text-center">
                      {error}
                    </p>
                  )}
                </div>
              )}

              <div className="flex gap-4 w-full mt-2">
                <Button
                  onClick={onClose}
                  className="flex-1 py-3 bg-white/5 border border-white/10 text-white font-bold uppercase text-xs tracking-widest rounded-[8px] hover:bg-white/10 transition-all"
                >
                  {cancelText}
                </Button>
                <Button
                  onClick={handleConfirm}
                  className={`flex-1 py-3 ${theme.btn} font-black uppercase text-xs tracking-widest rounded-[8px] transition-all shadow-lg shadow-black/20`}
                >
                  {confirmText}
                </Button>
              </div>
            </div>

            <Button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-gray-500 hover:text-white transition-colors"
            >
              <X size={20} />
            </Button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmationPopup;
