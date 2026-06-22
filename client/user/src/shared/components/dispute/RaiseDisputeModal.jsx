import React, { useState } from "react";
import { X, AlertOctagon, UploadCloud, ShieldAlert } from "lucide-react";
import useDispute from "@hooks/useDispute";import { Button, Input, Select, Textarea } from "@kridaz/ui";


export default function RaiseDisputeModal({ booking, onClose, onSuccess }) {
  const { raiseDispute, submitting } = useDispute();
  const [reason, setReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);

  const predefinedReasons = [
    "Venue was closed/unavailable",
    "Venue conditions were poor/unsafe",
    "Double booked by owner",
    "Staff behavior issue",
    "Other",
  ];

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + images.length > 5) {
      alert("You can only upload up to 5 images.");
      return;
    }

    setImages((prev) => [...prev, ...files]);

    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setPreviews((prev) => [...prev, ...newPreviews]);
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

    // Create FormData for file upload
    const formData = new FormData();
    formData.append("bookingId", booking.id || booking._id);
    formData.append("reason", reason);
    formData.append("customReason", customReason);
    formData.append("description", description);
    images.forEach((img) => formData.append("disputeImages", img));

    const success = await raiseDispute(formData);

    if (success) {
      onSuccess();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-fade-in">
      <div className="bg-background border border-red-500/30 rounded-[8px] w-full max-w-lg overflow-hidden shadow-2xl relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/10 blur-[80px] pointer-events-none" />

        <div className="p-6 border-b border-border flex justify-between items-center relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center">
              <ShieldAlert size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white uppercase tracking-tight">
                Raise Dispute
              </h2>
              <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest mt-1">
                Funds will be frozen
              </p>
            </div>
          </div>
          <Button
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors"
          >
            <X size={24} />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6 relative z-10">
          <div className="bg-red-500/5 border border-red-500/20 p-4 rounded-[6px] flex items-start gap-3">
            <AlertOctagon className="text-red-500 shrink-0 mt-0.5" size={16} />
            <p className="text-xs text-red-400 leading-relaxed font-medium">
              You are raising a dispute for your booking at{" "}
              <strong>{booking.turf.name}</strong>. Submitting a false dispute
              may lead to account suspension.
            </p>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Select Reason
            </label>
            <Select
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-background border border-border rounded-[6px] px-4 py-3.5 text-white focus:outline-none focus:border-red-500/50 transition-colors text-sm appearance-none"
            >
              <option value="" disabled>
                Choose a primary reason
              </option>
              {predefinedReasons.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </Select>
          </div>

          {reason === "Other" && (
            <div className="space-y-3 animate-fade-in">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Specify Reason
              </label>
              <Input
                required
                type="text"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Briefly state the issue"
                className="w-full bg-background border border-border rounded-[6px] px-4 py-3.5 text-white focus:outline-none focus:border-red-500/50 transition-colors text-sm"
              />
            </div>
          )}

          <div className="space-y-3">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Detailed Description
            </label>
            <Textarea
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide full details of what happened..."
              className="w-full bg-background border border-border rounded-[6px] px-4 py-3.5 text-white focus:outline-none focus:border-red-500/50 transition-colors text-sm min-h-[100px] resize-none custom-scrollbar"
            />
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">
              Evidence (Optional - Max 5)
            </label>

            <div className="grid grid-cols-5 gap-2">
              {previews.map((src, idx) => (
                <div
                  key={idx}
                  className="relative aspect-square rounded-lg overflow-hidden border border-border bg-background"
                >
                  <img
                    src={src}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <Button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-colors"
                  >
                    <X size={12} />
                  </Button>
                </div>
              ))}

              {images.length < 5 && (
                <label className="aspect-square rounded-lg border-2 border-dashed border-border hover:border-red-500/50 flex flex-col items-center justify-center cursor-pointer transition-all bg-background hover:bg-red-500/5 group">
                  <UploadCloud
                    size={20}
                    className="text-gray-500 group-hover:text-red-500 transition-colors"
                  />
                  <span className="text-[8px] font-bold text-gray-600 group-hover:text-red-500 uppercase mt-1">
                    Upload
                  </span>
                  <Input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          <Button
            type="submit"
            disabled={
              submitting ||
              !reason ||
              !description ||
              (reason === "Other" && !customReason)
            }
            className="w-full py-4 bg-red-500 hover:bg-red-600 text-white rounded-[6px] font-bold uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(239,68,68,0.2)]"
          >
            {submitting ? "Submitting..." : "Submit Dispute"}
          </Button>
        </form>
      </div>
    </div>
  );
}
