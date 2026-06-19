import React, { useState, useEffect } from "react";
import { X, Send } from "lucide-react";
import axiosInstance from "@hooks/useAxiosInstance";
import { toast } from "react-hot-toast";
import { useSelector } from "react-redux";

const RequestProModal = ({ isOpen, onClose, pro, onRequestSuccess }) => {
  const user = useSelector((state) => state.auth?.user);
  const [interestFor, setInterestFor] = useState("");
  const [phone, setPhone] = useState(user?.phone || user?.phoneNumber || "");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    console.log("RequestProModal user object:", user);
    const userPhone = user?.phone || user?.phoneNumber;
    if (userPhone) {
      setPhone(userPhone);
    }
  }, [user, isOpen]);

  const interestOptions = ["Booking", "Mentorship", "Event", "Collaboration"];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!interestFor || !phone || !message) {
      toast.error("Please fill all fields, including your phone number.");
      return;
    }

    setIsSubmitting(true);
    try {
      // pro.id is the User ID for the professional
      const res = await axiosInstance.post("/api/professional/user/inquiries", {
        proId: pro.id || pro._id,
        interestFor,
        phone,
        message,
      });

      if (res.data.success) {
        toast.success("Inquiry sent successfully!");
        onClose();
        if (onRequestSuccess) onRequestSuccess();
        setInterestFor("");
        setPhone("");
        setMessage("");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send inquiry");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-[#111111] border border-white/10 rounded-2xl p-6 shadow-2xl z-10 animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-black text-white">Send Request</h2>
          <button
            onClick={onClose}
            className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-white/70 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-black text-white/70 uppercase tracking-wider mb-2">
              Interest For
            </label>
            <div className="grid grid-cols-2 gap-2">
              {interestOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setInterestFor(option)}
                  className={`p-3 rounded-xl border text-sm font-bold transition-all ${
                    interestFor === option
                      ? "bg-[#BFF367]/10 border-[#BFF367] text-[#BFF367]"
                      : "bg-black/50 border-white/10 text-white/70 hover:border-white/30"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-white/70 uppercase tracking-wider mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => {
                if (!(user?.phone || user?.phoneNumber)) setPhone(e.target.value);
              }}
              readOnly={!!(user?.phone || user?.phoneNumber)}
              placeholder={(user?.phone || user?.phoneNumber) ? "Phone number from profile" : "Enter your phone number"}
              className={`w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none transition-colors ${
                (user?.phone || user?.phoneNumber) ? "opacity-50 cursor-not-allowed" : "focus:border-[#BFF367]"
              }`}
            />
          </div>

          <div>
            <label className="block text-xs font-black text-white/70 uppercase tracking-wider mb-2">
              Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tell the professional about your requirements..."
              rows={4}
              className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#BFF367] transition-colors resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-[#BFF367] to-[#8AD530] text-black font-black py-4 rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isSubmitting ? (
              <span className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Send size={18} />
                SEND REQUEST
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RequestProModal;
