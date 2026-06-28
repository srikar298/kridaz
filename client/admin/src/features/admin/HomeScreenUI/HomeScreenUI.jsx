import { useState, useEffect, useRef } from "react";
import axiosInstance from "@hooks/useAxiosInstance";
import { toast } from "react-hot-toast";
import { Plus, Trash2, Edit2, Layout, X, Upload } from "lucide-react";
import { Button, Input } from "@kridaz/ui";

export const HomeScreenUI = () => {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    title: "",
    targetUrl: "",
    order: 0,
    isActive: true,
  });

  const API_BASE = "/api/admin/marketing";

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get(`${API_BASE}/banners`);
      // Filter only QUICK_LINK type
      const quickLinks = (res.data.banners || []).filter(
        (b) => b.type === "QUICK_LINK"
      );
      setLinks(quickLinks);
    } catch (error) {
      console.error("Home Screen UI fetch error:", error);
      toast.error("Failed to fetch quick links");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (item = null) => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (item) {
      setEditingItem(item);
      setFormData({
        title: item.title || "",
        targetUrl: item.targetUrl || "",
        order: item.order || 0,
        isActive: item.isActive ?? true,
      });
      setPreviewUrl(item.imageUrl);
    } else {
      setEditingItem(null);
      setFormData({
        title: "",
        targetUrl: "",
        order: links.length + 1,
        isActive: true,
      });
    }
    setIsModalOpen(true);
  };

  const MAX_FILE_SIZE_MB = 200;
  const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > MAX_FILE_SIZE_BYTES) {
        const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
        toast.error(
          `File too large (${sizeMB}MB). Maximum allowed size is ${MAX_FILE_SIZE_MB}MB.`
        );
        e.target.value = "";
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const fData = new FormData();
      fData.append("title", formData.title || `Quick Link ${Date.now()}`);
      fData.append("targetUrl", formData.targetUrl || "");
      fData.append("order", formData.order);
      fData.append("isActive", formData.isActive);
      fData.append("type", "QUICK_LINK");

      if (selectedFile) {
        fData.append("image", selectedFile);
      } else if (editingItem && editingItem.imageUrl) {
        fData.append("imageUrl", editingItem.imageUrl);
      }

      const headers = { "Content-Type": "multipart/form-data" };

      if (editingItem) {
        await axiosInstance.put(
          `${API_BASE}/banners/${editingItem._id || editingItem.id}`,
          fData,
          { headers }
        );
        toast.success("Updated successfully");
      } else {
        await axiosInstance.post(`${API_BASE}/banners`, fData, { headers });
        toast.success("Created successfully");
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      console.error("Save error:", error);
      toast.error(error.response?.data?.message || "Failed to save data");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this link?")) return;
    try {
      await axiosInstance.delete(`${API_BASE}/banners/${id}`);
      toast.success("Deleted successfully");
      fetchData();
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete");
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-lime-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl font-bebas">
            HOME SCREEN UI UPDATES
          </h1>
          <p className="text-sm text-gray-400">
            Manage Quick Links on the mobile home screen.
          </p>
        </div>
        <Button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center gap-2 bg-lime-500 text-black px-4 py-2 rounded-[6px] font-bold hover:bg-lime-400 transition-colors"
        >
          <Plus size={18} />
          Add Quick Link
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {links.map((item) => (
          <div
            key={item.id}
            className={`relative overflow-hidden rounded-[12px] border ${
              item.isActive ? "border-white/10" : "border-red-500/50"
            } bg-[#161616] group`}
          >
            <div className="aspect-[4/3] bg-black relative">
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500">
                  <Layout size={32} />
                </div>
              )}
              {!item.isActive && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <span className="text-red-500 font-bold bg-black/80 px-3 py-1 rounded">
                    INACTIVE
                  </span>
                </div>
              )}
            </div>

            <div className="p-4">
              <h3 className="font-bold text-white truncate mb-1">
                {item.title}
              </h3>
              <p className="text-xs text-gray-400 truncate mb-4">
                {item.targetUrl || "No Link provided"}
              </p>

              <div className="flex gap-2">
                <Button
                  onClick={() => handleOpenModal(item)}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-white border border-white/5 h-9"
                >
                  <Edit2 size={16} />
                </Button>
                <Button
                  onClick={() => handleDelete(item.id)}
                  className="w-12 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 h-9"
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            </div>
          </div>
        ))}
        {links.length === 0 && (
          <div className="col-span-full py-12 text-center text-gray-400 bg-white/5 rounded-xl border border-white/10">
            <Layout className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium text-white mb-1">No Quick Links</p>
            <p className="text-sm">Click &quot;Add Quick Link&quot; to get started.</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-lg rounded-[12px] bg-[#1a1a1a] border border-white/10 overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/10 p-4">
              <h2 className="text-xl font-bold text-white">
                {editingItem ? "Edit Quick Link" : "Add Quick Link"}
              </h2>
              {/* eslint-disable-next-line react/forbid-elements */}
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div
                className="group relative flex h-40 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-white/10 bg-black/50 hover:border-lime-500/50 hover:bg-black overflow-hidden"
                onClick={() => fileInputRef.current?.click()}
              >
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="text-center">
                    <Upload className="mx-auto mb-2 h-8 w-8 text-gray-500 group-hover:text-lime-500" />
                    <p className="text-sm font-medium text-gray-400">
                      Click to upload image
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Max size: 200MB
                    </p>
                  </div>
                )}
                {/* eslint-disable-next-line react/forbid-elements */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-400">
                  Title (Alt text for image)
                </label>
                <Input
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="e.g. Players Nearby"
                  className="w-full bg-black/50 border-white/10"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-400">
                  Target URL (Navigation Link)
                </label>
                <Input
                  value={formData.targetUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, targetUrl: e.target.value })
                  }
                  placeholder="e.g. /players or https://google.com"
                  className="w-full bg-black/50 border-white/10"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-400">
                    Order (Sorting)
                  </label>
                  <Input
                    type="number"
                    value={formData.order}
                    onChange={(e) =>
                      setFormData({ ...formData, order: Number(e.target.value) })
                    }
                    className="w-full bg-black/50 border-white/10"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-400">
                    Status
                  </label>
                  {/* eslint-disable-next-line react/forbid-elements */}
                  <select
                    value={formData.isActive.toString()}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        isActive: e.target.value === "true",
                      })
                    }
                    className="h-[46px] w-full rounded-xl border border-white/10 bg-black/50 px-4 text-white outline-none focus:border-lime-500"
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-white"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-lime-500 text-black hover:bg-lime-400"
                >
                  Save Quick Link
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomeScreenUI;
