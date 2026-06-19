import React, { useState } from "react";
import { Upload, X, CheckCircle, AlertCircle, FileText, ImageIcon } from "lucide-react";
import axiosInstance from "@hooks/useAxiosInstance";
import toast from "react-hot-toast";

const FileUpload = ({
  label,
  onUploadSuccess,
  folder = "kridaz/verification",
  accept = "image/*,.pdf",
}) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState("");
  const [preview, setPreview] = useState("");

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    // Check file size (limit to 5MB)
    if (selectedFile.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    setFile(selectedFile);

    // Create preview if it's an image
    if (selectedFile.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setPreview("");
    }

    // Auto-upload
    await uploadFile(selectedFile);
  };

  const uploadFile = async (selectedFile) => {
    setUploading(true);
    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("folder", folder);

    try {
      const response = await axiosInstance.post("/api/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data.success) {
        setUploadedUrl(response.data.url);
        onUploadSuccess(response.data.url, selectedFile.name);
        toast.success(`${label} uploaded successfully`);
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(`Failed to upload ${label}`);
      setFile(null);
      setPreview("");
    } finally {
      setUploading(false);
    }
  };

  const clearFile = () => {
    setFile(null);
    setPreview("");
    setUploadedUrl("");
    onUploadSuccess("", "");
  };

  return (
    <div className="space-y-3 group/field">
      <label className="text-xs font-bold text-white/20 uppercase tracking-widest group-focus-within/field:text-[#BFF367] transition-colors ml-1">
        {label}
      </label>

      <div
        className={`relative min-h-[120px] rounded-[8px] border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center p-4 overflow-hidden ${uploadedUrl ? "border-[#BFF367]/50 bg-[#BFF367]/5" : "border-white/5 bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.04]"}`}
      >
        {!file ? (
          <>
            <input
              type="file"
              accept={accept}
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer z-10"
            />
            <div className="flex flex-col items-center gap-3 text-center pointer-events-none">
              <div className="w-10 h-10 rounded-[8px] bg-white/5 flex items-center justify-center">
                <Upload size={18} className="text-white/20" />
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                  Click or drag to upload
                </p>
                <p className="text-[8px] text-white/10 uppercase tracking-[0.2em]">
                  {accept.replace(/\*/g, "Files")}
                </p>
              </div>
            </div>
          </>
        ) : (
          <div className="w-full flex items-center gap-4 relative z-20">
            {/* Preview or Icon */}
            <div className="w-16 h-16 rounded-[8px] bg-black border border-white/10 flex items-center justify-center overflow-hidden flex-shrink-0">
              {preview ? (
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <FileText size={24} className="text-[#BFF367]" />
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate uppercase tracking-wider">
                {file.name}
              </p>
              <p className="text-[10px] text-white/40 uppercase tracking-widest">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>

              <div className="mt-2 flex items-center gap-2">
                {uploading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#BFF367] animate-pulse" />
                    <span className="text-[8px] font-bold text-[#BFF367] uppercase tracking-widest animate-pulse">
                      Uploading...
                    </span>
                  </div>
                ) : uploadedUrl ? (
                  <div className="flex items-center gap-2 text-[#BFF367]">
                    <CheckCircle size={10} />
                    <span className="text-[8px] font-bold uppercase tracking-widest">
                      Uploaded Successfully
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-red-400">
                    <AlertCircle size={10} />
                    <span className="text-[8px] font-bold uppercase tracking-widest">
                      Upload Failed
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            {!uploading && (
              <button
                onClick={clearFile}
                className="w-8 h-8 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-500 flex items-center justify-center transition-colors"
              >
                <X size={14} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUpload;
