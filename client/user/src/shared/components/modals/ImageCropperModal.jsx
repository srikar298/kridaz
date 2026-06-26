import React, { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { X, Check } from "lucide-react";
import getCroppedImg from "../../utils/cropImage";
import { Button } from "@kridaz/ui";

export default function ImageCropperModal({
  imageSrc,
  aspect = 1,
  onCropComplete,
  onClose,
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isCropping, setIsCropping] = useState(false);

  const handleCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSave = async () => {
    if (!croppedAreaPixels) return;

    try {
      setIsCropping(true);
      const croppedImageBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      onCropComplete(croppedImageBlob);
    } catch (e) {
      console.error(e);
    } finally {
      setIsCropping(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/90 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-card border border-border rounded-[16px] overflow-hidden shadow-2xl flex flex-col h-[70vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between z-10 bg-card">
          <h2 className="text-sm font-black uppercase tracking-[0.2em] text-white">
            Adjust Image
          </h2>
          <Button
            onClick={onClose}
            className="p-2 rounded-[6px] hover:bg-background text-white/40 hover:text-white transition-all"
           aria-label="Close">
            <X size={20} />
          </Button>
        </div>

        {/* Cropper Container */}
        <div className="relative flex-1 bg-black w-full h-full">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={setCrop}
            onCropComplete={handleCropComplete}
            onZoomChange={setZoom}
            classes={{
              containerClassName: "absolute inset-0",
            }}
          />
        </div>

        {/* Zoom Controls & Actions */}
        <div className="p-6 bg-card border-t border-border z-10 flex flex-col gap-4 shrink-0">
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-bold text-white/50 uppercase">Zoom</span>
            <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              aria-labelledby="Zoom"
              onChange={(e) => setZoom(e.target.value)}
              className="w-full accent-primary h-1 bg-border rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div className="flex gap-4">
            <Button
              type="button"
              onClick={onClose}
              className="flex-1 h-12 bg-background border border-border rounded-[12px] text-white/70 hover:text-white font-bold transition-all"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={isCropping}
              className="flex-1 h-12 bg-primary text-black rounded-[12px] font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-50"
             aria-label="Confirm">
              <Check size={18} />
              {isCropping ? "Cropping..." : "Save"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
