import React from "react";
import { FileText, CheckCircle2 } from "lucide-react";

const DocumentUpload = ({ label, id, onFileSelect, selectedFile }) => {
  return (
    <div className="relative group">
      <input
        type="file"
        id={id}
        className="hidden"
        onChange={(e) => onFileSelect(e.target.files[0])}
        accept="image/*,.pdf"
      />
      <label
        htmlFor={id}
        className={`flex flex-col items-center justify-center p-6 border border-dashed transition-all cursor-pointer h-32 text-center rounded-[8px] ${selectedFile ? "border-[#CCFF00] bg-[#CCFF00]/5" : "border-[#2D2D2D] bg-[#000000] hover:border-[#CCFF00]/50 hover:bg-[#CCFF00]/5"}`}
      >
        {selectedFile ? (
          <div className="space-y-1">
            <CheckCircle2 className="text-[#CCFF00] mx-auto mb-1" size={24} />
            <span className="text-[10px] font-bold text-[#CCFF00] uppercase truncate max-w-[140px] block">
              {selectedFile.name}
            </span>
          </div>
        ) : (
          <div className="space-y-1">
            <div className="w-10 h-10 bg-[#CCFF00]/10 rounded-[6px] flex items-center justify-center mx-auto mb-1 transition-transform">
              <FileText size={18} className="text-gray-500" />
            </div>
            <span className="text-[10px] font-normal text-[#878C9F] uppercase tracking-wider group-hover:text-[#CCFF00] transition-colors">
              {label}
            </span>
          </div>
        )}
      </label>
    </div>
  );
};

export default DocumentUpload;
