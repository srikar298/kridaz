import React, { useState, useEffect, useRef } from "react";
import { Plus, Edit2, Trash2, Download, QrCode } from "lucide-react";
import { Button } from "@kridaz/ui";
import { QRCodeSVG } from "qrcode.react";
import toast from "react-hot-toast";
import axios from "axios";

import { store } from "../../../redux/store";

// Using axios directly with the admin token if api utility is not standard
// We get token directly from the redux store
const getToken = () => store.getState().auth?.token || "";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:6001";

const QRCodeManager = () => {
  const [qrCodes, setQrCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ id: null, name: "", targetUrl: "", fallbackUrl: "", isActive: true });
  const [isEditing, setIsEditing] = useState(false);


  const qrRefs = useRef({});

  useEffect(() => {
    fetchQRCodes();
  }, []);

  const fetchQRCodes = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${API_BASE}/api/admin/qr`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      if (data.success) {
        setQrCodes(data.data);
      }
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to fetch QR codes");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (qrCode = null) => {
    if (qrCode) {
      setFormData(qrCode);
      setIsEditing(true);
    } else {
      setFormData({ id: null, name: "", targetUrl: "", fallbackUrl: "", isActive: true });
      setIsEditing(false);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData({ id: null, name: "", targetUrl: "", fallbackUrl: "", isActive: true });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: formData.name,
        targetUrl: formData.targetUrl,
        fallbackUrl: formData.fallbackUrl,
        isActive: formData.isActive
      };

      if (isEditing) {
        await axios.put(`${API_BASE}/api/admin/qr/${formData.id}`, payload, {
          headers: { Authorization: `Bearer ${getToken()}` }
        });
        toast.success("QR Code updated successfully");
      } else {
        await axios.post(`${API_BASE}/api/admin/qr`, payload, {
          headers: { Authorization: `Bearer ${getToken()}` }
        });
        toast.success("QR Code created successfully");
      }
      handleCloseModal();
      fetchQRCodes();
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to save QR code");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this QR code?")) return;
    try {
      await axios.delete(`${API_BASE}/api/admin/qr/${id}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      toast.success("QR Code deleted successfully");
      fetchQRCodes();
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to delete QR code");
    }
  };

  const downloadQR = (id, name) => {
    const svgElement = qrRefs.current[id];
    if (!svgElement) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      // Add padding
      const padding = 20;
      canvas.width = img.width + padding * 2;
      canvas.height = img.height + padding * 2;
      
      // Draw white background
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw image
      ctx.drawImage(img, padding, padding);
      
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `QR_${name.replace(/\s+/g, "_")}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  return (
    <div className="p-6 text-white h-full overflow-y-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
            <QrCode size={24} />
            QR Codes
          </h1>
          <p className="text-white/60 text-sm mt-1">
            Generate static QR codes for your links
          </p>
        </div>
        <Button onClick={() => handleOpenModal()} className="bg-primary text-black hover:bg-primary/90">
          <Plus size={18} className="mr-2" /> Create QR Code
        </Button>
      </div>


      {loading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {qrCodes.map((qr) => (
            <div key={qr.id} className="bg-white/5 border border-white/10 rounded-xl p-5 flex flex-col items-center relative group">
              <div className="bg-white p-3 rounded-lg mb-4 mt-2">
                <QRCodeSVG
                  value={qr.targetUrl || "https://kridaz.com"}
                  size={150}
                  level={"H"}
                  includeMargin={false}
                  ref={(el) => (qrRefs.current[qr.id] = el)}
                />
              </div>
              
              <h3 className="text-lg font-semibold text-center mb-1 w-full truncate" title={qr.name}>
                {qr.name}
              </h3>
              
              <div className="w-full space-y-2 mt-4 text-sm">
                <div className="flex flex-col">
                  <span className="text-white/50 text-xs">Link (URL):</span>
                  <a href={qr.targetUrl} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline truncate" title={qr.targetUrl}>
                    {qr.targetUrl || "None"}
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-6 w-full pt-4 border-t border-white/10">
                <button
                  onClick={() => downloadQR(qr.id, qr.name)}
                  className="flex-1 flex justify-center items-center py-2 bg-white/10 hover:bg-white/20 rounded transition-colors text-sm"
                >
                  <Download size={16} className="mr-1" /> Download
                </button>
                <button
                  onClick={() => handleOpenModal(qr)}
                  className="p-2 bg-white/10 hover:bg-white/20 text-blue-400 rounded transition-colors"
                  title="Edit"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => handleDelete(qr.id)}
                  className="p-2 bg-white/10 hover:bg-white/20 text-red-400 rounded transition-colors"
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}

          {qrCodes.length === 0 && (
            <div className="col-span-full py-12 text-center border border-dashed border-white/20 rounded-xl">
              <QrCode size={48} className="mx-auto text-white/20 mb-4" />
              <p className="text-white/60">No QR codes created yet.</p>
            </div>
          )}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#111] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold mb-4">{isEditing ? "Edit QR Code" : "Create QR Code"}</h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">Name / Identifier</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-primary transition-colors"
                  placeholder="e.g., Summer Tournament Link"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">Link (URL)</label>
                <input
                  type="url"
                  required
                  value={formData.targetUrl}
                  onChange={(e) => setFormData({ ...formData, targetUrl: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-primary transition-colors"
                  placeholder="https://example.com/target"
                />
              </div>

              <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 rounded-lg text-white/60 hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <Button type="submit" className="bg-primary text-black hover:bg-primary/90 px-6 py-2">
                  {isEditing ? "Save Changes" : "Create"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default QRCodeManager;
