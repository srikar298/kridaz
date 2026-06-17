import React, { useState } from "react";
import { X, AlertOctagon, UploadCloud, ShieldAlert, ArrowRight, ArrowLeft } from "lucide-react";
import useDispute from "@hooks/useDispute";

export default function ReportIssueFlowModal({ booking, onClose, onSuccess }) {
  const { raiseDispute, submitting } = useDispute();
  const [step, setStep] = useState(1);
  const [requestType, setRequestType] = useState("RESCHEDULE_OR_REFUND");
  const [reason, setReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);

  const predefinedReasons = [
    "Rain / Bad Weather",
    "Ground Not Playable",
    "Water Logging",
    "Venue Closed / Unavailable",
    "Double booked by owner",
    "Staff behavior issue",
    "Other"
  ];

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + images.length > 5) {
      alert("You can only upload up to 5 images.");
      return;
    }
    
    setImages(prev => [...prev, ...files]);
    
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setPreviews(prev => [...prev, ...newPreviews]);
  };

  const removeImage = (index) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);

    const newPreviews = [...previews];
    URL.revokeObjectURL(newPreviews[index]);
    newPreviews.splice(index, 1);
    setPreviews(newPreviews);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const formData = new FormData();
    formData.append("bookingId", booking.id || booking._id);
    formData.append("requestType", requestType);
    formData.append("reason", reason);
    formData.append("customReason", customReason);
    formData.append("description", description);
    images.forEach(img => formData.append("disputeImages", img));

    const success = await raiseDispute(formData);
    
    if (success) {
      onSuccess();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-fade-in font-inter">
      <div className="bg-[#000000] border border-[#2D2D2D] rounded-[16px] w-full max-w-lg overflow-hidden shadow-2xl relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#CCFF00]/5 blur-[80px] pointer-events-none" />
        
        <div className="p-6 border-b border-[#2D2D2D] flex justify-between items-center relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/5 text-white flex items-center justify-center">
              <ShieldAlert size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black text-white uppercase tracking-tight">Report Booking Issue</h2>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">Booking #{ (booking.id || booking._id)?.slice(-5).toUpperCase() }</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={step === 2 ? handleSubmit : (e) => { e.preventDefault(); setStep(2); }} className="p-8 space-y-6 relative z-10">
          
          {step === 1 && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-white/5 border border-white/10 p-4 rounded-[8px] flex items-start gap-3">
                <AlertOctagon className="text-[#CCFF00] shrink-0 mt-0.5" size={16} />
                <p className="text-xs text-gray-300 leading-relaxed font-medium">
                  Select how you would like to resolve your issue with <strong>{booking.turf?.name || "the venue"}</strong>. 
                  Your request will be sent directly to the Venue Owner.
                </p>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Select Request Type</label>
                
                <div 
                  onClick={() => setRequestType("RESCHEDULE")}
                  className={`p-4 rounded-[8px] border cursor-pointer transition-all ${requestType === "RESCHEDULE" ? 'bg-[#CCFF00]/10 border-[#CCFF00] shadow-[0_0_15px_rgba(204,255,0,0.15)]' : 'bg-white/5 border-[#2D2D2D] hover:border-white/20'}`}
                >
                  <h3 className={`text-sm font-black uppercase tracking-tight ${requestType === "RESCHEDULE" ? 'text-[#CCFF00]' : 'text-white'}`}>Request Reschedule</h3>
                  <p className="text-xs text-gray-500 mt-1">Ask the owner to move your slot to a different date/time.</p>
                </div>

                <div 
                  onClick={() => setRequestType("WALLET_REFUND")}
                  className={`p-4 rounded-[8px] border cursor-pointer transition-all ${requestType === "WALLET_REFUND" ? 'bg-[#CCFF00]/10 border-[#CCFF00] shadow-[0_0_15px_rgba(204,255,0,0.15)]' : 'bg-white/5 border-[#2D2D2D] hover:border-white/20'}`}
                >
                  <h3 className={`text-sm font-black uppercase tracking-tight ${requestType === "WALLET_REFUND" ? 'text-[#CCFF00]' : 'text-white'}`}>Request Wallet Refund</h3>
                  <p className="text-xs text-gray-500 mt-1">Ask for the amount to be credited back to your KRIDAZ Wallet.</p>
                </div>

                <div 
                  onClick={() => setRequestType("RESCHEDULE_OR_REFUND")}
                  className={`p-4 rounded-[8px] border cursor-pointer transition-all ${requestType === "RESCHEDULE_OR_REFUND" ? 'bg-[#CCFF00]/10 border-[#CCFF00] shadow-[0_0_15px_rgba(204,255,0,0.15)]' : 'bg-white/5 border-[#2D2D2D] hover:border-white/20'}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className={`text-sm font-black uppercase tracking-tight ${requestType === "RESCHEDULE_OR_REFUND" ? 'text-[#CCFF00]' : 'text-white'}`}>Reschedule First</h3>
                    <span className="bg-[#CCFF00] text-black text-[8px] font-black uppercase px-1.5 py-0.5 rounded">Recommended</span>
                  </div>
                  <p className="text-xs text-gray-500">Slot allotment is subject to venue availability. If reschedule is not possible, the eligible amount will be credited to your KRIDAZ Wallet.</p>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-white text-black hover:bg-gray-200 rounded-[8px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
              >
                Next Step <ArrowRight size={16} />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-fade-in">
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Primary Reason</label>
                <select
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full bg-[#000000] border border-[#2D2D2D] rounded-[8px] px-4 py-3.5 text-white focus:outline-none focus:border-white/50 transition-colors text-sm appearance-none"
                >
                  <option value="" disabled>Choose a reason...</option>
                  {predefinedReasons.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              {reason === "Other" && (
                <div className="space-y-3 animate-fade-in">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Specify Reason</label>
                  <input
                    required
                    type="text"
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    placeholder="Briefly state the issue"
                    className="w-full bg-[#000000] border border-[#2D2D2D] rounded-[8px] px-4 py-3.5 text-white focus:outline-none focus:border-white/50 transition-colors text-sm"
                  />
                </div>
              )}

              <div className="space-y-3">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Detailed Context</label>
                <textarea
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide details for the venue owner..."
                  className="w-full bg-[#000000] border border-[#2D2D2D] rounded-[8px] px-4 py-3.5 text-white focus:outline-none focus:border-white/50 transition-colors text-sm min-h-[100px] resize-none custom-scrollbar"
                />
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Photo/Video Proof (Optional - Max 5)</label>
                
                <div className="grid grid-cols-5 gap-2">
                  {previews.map((src, idx) => (
                    <div key={idx} className="relative aspect-square rounded-[6px] overflow-hidden border border-[#2D2D2D] bg-[#000000]">
                      <img src={src} alt="Preview" className="w-full h-full object-cover" />
                      <button 
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-colors"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                  
                  {images.length < 5 && (
                    <label className="aspect-square rounded-[6px] border border-dashed border-[#2D2D2D] hover:border-white/50 flex flex-col items-center justify-center cursor-pointer transition-all bg-white/5 hover:bg-white/10 group">
                      <UploadCloud size={20} className="text-gray-500 group-hover:text-white transition-colors" />
                      <span className="text-[8px] font-bold text-gray-600 group-hover:text-white uppercase mt-1">Upload</span>
                      <input 
                        type="file" 
                        multiple 
                        accept="image/*,video/*" 
                        onChange={handleImageChange} 
                        className="hidden" 
                      />
                    </label>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-14 py-4 bg-white/5 hover:bg-white/10 text-white border border-[#2D2D2D] rounded-[8px] transition-all flex items-center justify-center"
                >
                  <ArrowLeft size={16} />
                </button>
                <button
                  type="submit"
                  disabled={submitting || !reason || !description || (reason === "Other" && !customReason)}
                  className="flex-1 py-4 bg-[#CCFF00] hover:bg-[#b3e600] text-black rounded-[8px] font-black uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(204,255,0,0.15)]"
                >
                  {submitting ? "Sending Request..." : "Send Request to Owner"}
                </button>
              </div>
            </div>
          )}

        </form>
      </div>
    </div>
  );
}
