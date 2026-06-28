import { useState, useEffect, useRef } from "react";
import axiosInstance from "@hooks/useAxiosInstance";
import { toast } from "react-hot-toast";
import {
  Plus,
  Trash2,
  Edit2,
  Layout,
  X,
  Upload,
  Image as ImageIcon,
  Activity as BellIcon,
  Link as LinkIcon,
} from "lucide-react";
import PushComposer from "./PushComposer";
import { Button, Input } from "@kridaz/ui";

export const MarketingManagement = () => {
  const [activeTab, setActiveTab] = useState("banners");
  const [banners, setBanners] = useState([]);
  const [quickLinks, setQuickLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    imageUrl: "",
    videoUrl: "",
    targetUrl: "",
    order: 0,
    isActive: true,
  });

  const displayBanners =
    activeTab === "promotions"
      ? banners.filter((b) => b.type === "PROMOTION")
      : activeTab === "professional-banners"
      ? banners.filter((b) => b.type === "PROFESSIONAL")
      : activeTab === "home-quick-links"
      ? banners.filter((b) => b.type === "QUICK_LINK")
      : activeTab === "quick-links"
      ? quickLinks
      : banners.filter((b) => b.type === "HOME" || !b.type);

  const API_BASE = "/api/admin/marketing";

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get(`${API_BASE}/banners`);
      setBanners(res.data.banners || []);
      const quickLinkRes = await axiosInstance.get(`${API_BASE}/quick-links`);
      setQuickLinks(quickLinkRes.data.quickLinks || []);
    } catch (error) {
      console.error("Marketing fetch error:", error);
      toast.error("Failed to fetch banners");
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
        description: item.description || "",
        imageUrl: item.imageUrl || "",
        videoUrl: item.videoUrl || "",
        targetUrl: item.targetUrl || "",
        order: item.order || 0,
        isActive: item.isActive ?? true,
      });
      setPreviewUrl(item.imageUrl || item.videoUrl);
    } else {
      setEditingItem(null);
      setFormData({
        title: "",
        description: "",
        imageUrl: "",
        videoUrl: "",
        targetUrl: "",
        order: displayBanners.length + 1,
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
      setFormData((prev) => ({ ...prev, imageUrl: "", videoUrl: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let dataToSubmit;
      let headers = {};

      let endpoint = activeTab === "quick-links" ? "quick-links" : "banners";

      if (activeTab === "banners" || activeTab === "promotions" || activeTab === "quick-links" || activeTab === "professional-banners" || activeTab === "home-quick-links") {
        const fData = new FormData();
        fData.append("title", formData.title || `Banner ${Date.now()}`);
        fData.append("description", formData.description || "");
        fData.append("targetUrl", formData.targetUrl || "");
        fData.append("order", formData.order);
        fData.append("isActive", formData.isActive);
        if (activeTab !== "quick-links") {
          let bannerType = "HOME";
          if (activeTab === "promotions") bannerType = "PROMOTION";
          if (activeTab === "professional-banners") bannerType = "PROFESSIONAL";
          if (activeTab === "home-quick-links") bannerType = "QUICK_LINK";
          fData.append("type", bannerType);
        }

        if (selectedFile) {
          fData.append("image", selectedFile);
        } else {
          if (formData.imageUrl) fData.append("imageUrl", formData.imageUrl);
          if (formData.videoUrl) fData.append("videoUrl", formData.videoUrl);
        }
        dataToSubmit = fData;
        headers = { "Content-Type": "multipart/form-data" };
      }

      if (editingItem) {
        await axiosInstance.put(
          `${API_BASE}/${endpoint}/${editingItem._id || editingItem.id}`,
          dataToSubmit,
          { headers }
        );
        toast.success("Updated successfully");
      } else {
        await axiosInstance.post(`${API_BASE}/${endpoint}`, dataToSubmit, {
          headers,
        });
        toast.success("Created successfully");
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      console.error("Marketing save error:", error);
      toast.error(error.response?.data?.message || "Failed to save data");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure?")) return;
    try {
      let endpoint = activeTab === "quick-links" ? "quick-links" : "banners";
      await axiosInstance.delete(`${API_BASE}/${endpoint}/${id}`);
      toast.success("Deleted successfully");
      fetchData();
    } catch (error) {
      console.error("Marketing delete error:", error);
      toast.error("Failed to delete");
    }
  };

  const isVideoFile = (file) => {
    return file && file.type ? file.type.startsWith("video/") : false;
  };

  const isVideoUrl = (url) => {
    return url
      ? url.includes(".mp4") ||
          url.includes(".webm") ||
          url.includes(".mov") ||
          url.includes("video/upload")
      : false;
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
            MARKETING HUB
          </h1>
          <p className="text-sm text-gray-400">
            Manage your homepage ad banners and push announcements.
          </p>
        </div>
        {activeTab !== "notifications" && (
          <Button
            onClick={() => handleOpenModal()}
            className="inline-flex items-center gap-2 bg-lime-500 text-black px-4 py-2 rounded-[6px] font-bold hover:bg-lime-400 transition-colors"
          >
            <Plus size={18} />
            Add New Banner
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10">
        <Button
          onClick={() => setActiveTab("banners")}
          className={`px-6 py-3 text-sm font-bold uppercase tracking-wider transition-colors border-b-2 ${activeTab === "banners" ? "border-lime-500 text-lime-500" : "border-transparent text-gray-400 hover:text-white"}`}
        >
          <div className="flex items-center gap-2">
            <Layout size={16} />
            Ad Banners
          </div>
        </Button>
        <Button
          onClick={() => setActiveTab("professional-banners")}
          className={`px-6 py-3 text-sm font-bold uppercase tracking-wider transition-colors border-b-2 ${activeTab === "professional-banners" ? "border-lime-500 text-lime-500" : "border-transparent text-gray-400 hover:text-white"}`}
        >
          <div className="flex items-center gap-2">
            <Layout size={16} />
            Professional Ads Banners
          </div>
        </Button>
        <Button
          onClick={() => setActiveTab("home-quick-links")}
          className={`px-6 py-3 text-sm font-bold uppercase tracking-wider transition-colors border-b-2 ${activeTab === "home-quick-links" ? "border-lime-500 text-lime-500" : "border-transparent text-gray-400 hover:text-white"}`}
        >
          <div className="flex items-center gap-2">
            <Layout size={16} />
            Home UI Quick Links
          </div>
        </Button>
        <Button
          onClick={() => setActiveTab("promotions")}
          className={`px-6 py-3 text-sm font-bold uppercase tracking-wider transition-colors border-b-2 ${activeTab === "promotions" ? "border-lime-500 text-lime-500" : "border-transparent text-gray-400 hover:text-white"}`}
        >
          <div className="flex items-center gap-2">
            <ImageIcon size={16} />
            Promotions
          </div>
        </Button>
        <Button
          onClick={() => setActiveTab("quick-links")}
          className={`px-6 py-3 text-sm font-bold uppercase tracking-wider transition-colors border-b-2 ${activeTab === "quick-links" ? "border-lime-500 text-lime-500" : "border-transparent text-gray-400 hover:text-white"}`}
        >
          <div className="flex items-center gap-2">
            <LinkIcon size={16} />
            Quick Links
          </div>
        </Button>
        <Button
          onClick={() => setActiveTab("notifications")}
          className={`px-6 py-3 text-sm font-bold uppercase tracking-wider transition-colors border-b-2 ${activeTab === "notifications" ? "border-lime-500 text-lime-500" : "border-transparent text-gray-400 hover:text-white"}`}
        >
          <div className="flex items-center gap-2">
            <BellIcon size={16} />
            Push Notifications
          </div>
        </Button>
      </div>

      {/* Content */}
      {activeTab === "notifications" ? (
        <PushComposer />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {displayBanners.map((item) => (
            <div
              key={item._id || item.id}
              className="group relative flex flex-col rounded-[8px] border border-white/10 bg-card overflow-hidden transition-all hover:border-lime-500/50"
            >
              <div className="aspect-video w-full bg-black overflow-hidden relative">
                {item.videoUrl ? (
                  <video
                    src={item.videoUrl}
                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                    muted
                    playsInline
                  />
                ) : (
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                  />
                )}
                {!item.isActive && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <span className="bg-red-500 text-white text-[10px] px-2 py-1 rounded font-bold uppercase">
                      Inactive
                    </span>
                  </div>
                )}
              </div>

              <div className="p-5 flex-1 flex flex-col">
                <div className="flex items-start justify-between mb-1">
                  <h3 className="font-bold text-white truncate pr-4">
                    {item.title}
                  </h3>
                </div>
                {item.description && (
                  <p className="text-[11px] text-gray-400 line-clamp-2 mb-2 leading-relaxed">
                    {item.description}
                  </p>
                )}
                <p className="text-xs text-gray-500 truncate mb-4 mt-auto">
                  {item.targetUrl || "No target URL"}
                </p>

                <div className="flex items-center gap-2 pt-4 border-t border-white/5">
                  <Button
                    onClick={() => handleOpenModal(item)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition-all text-xs font-bold"
                  >
                    <Edit2 size={14} />
                    Edit
                  </Button>
                  <Button
                    onClick={() => handleDelete(item._id || item.id)}
                    className="w-10 h-10 flex items-center justify-center rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            </div>
          ))}

          {displayBanners.length === 0 && (
            <div className="col-span-full py-20 flex flex-col items-center justify-center border border-dashed border-white/10 rounded-[8px]">
              <Layout size={40} className="text-gray-600 mb-4" />
              <h3 className="text-white font-bold">No banners found</h3>
              <p className="text-gray-400 text-sm">
                Start by adding your first banner.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-card border border-white/10 rounded-[8px] overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-xl font-bold font-bebas tracking-wider text-white">
                {editingItem ? "EDIT" : "ADD NEW"} BANNER
              </h2>
              <Button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <X size={20} />
              </Button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="p-6 space-y-5 max-h-[calc(100vh-200px)] overflow-y-auto custom-scrollbar"
            >
              <div className="grid grid-cols-1 gap-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
                    Title (Optional)
                  </label>
                  <Input
                    type="text"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-lime-500 transition-colors text-sm"
                    placeholder="e.g. Summer Sale 20%"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-lime-500 transition-colors text-sm min-h-[80px]"
                    placeholder="Short description or subtitle..."
                  />
                </div>

                <div className="space-y-3">
                  <label className="block text-xs font-bold uppercase tracking-widest text-gray-500">
                    Banner Image or 1-Min Video
                  </label>

                  <div className="flex flex-col gap-3">
                    {/* Compact Preview Area */}
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="relative h-44 w-full rounded-[8px] border-2 border-dashed border-white/10 bg-white/5 overflow-hidden group cursor-pointer hover:border-lime-500/50 transition-all flex flex-col items-center justify-center gap-2"
                    >
                      {previewUrl ? (
                        <>
                          {isVideoFile(selectedFile) ||
                          isVideoUrl(formData.videoUrl) ||
                          (editingItem &&
                            editingItem.videoUrl &&
                            !selectedFile) ? (
                            <video
                              src={previewUrl}
                              className="w-full h-full object-contain bg-black/20"
                              controls
                              muted
                              playsInline
                            />
                          ) : (
                            <img
                              src={previewUrl}
                              className="w-full h-full object-contain bg-black/20"
                              alt="Preview"
                            />
                          )}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity pointer-events-none">
                            <div className="bg-lime-500 text-black p-2 rounded-full">
                              <Upload size={18} />
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="p-3 rounded-full bg-white/5 text-gray-500 group-hover:text-lime-500 group-hover:bg-lime-500/10 transition-all">
                            <Upload size={24} />
                          </div>
                          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                            Click to upload image or video
                          </span>
                        </>
                      )}
                      <Input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                        accept="image/*,video/*"
                      />
                    </div>

                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <ImageIcon size={14} className="text-gray-500" />
                      </div>
                      <Input
                        type="text"
                        value={formData.imageUrl || formData.videoUrl}
                        onChange={(e) => {
                          const val = e.target.value;
                          const isVid = isVideoUrl(val);
                          if (isVid) {
                            setFormData({
                              ...formData,
                              videoUrl: val,
                              imageUrl: "",
                            });
                          } else {
                            setFormData({
                              ...formData,
                              imageUrl: val,
                              videoUrl: "",
                            });
                          }
                          setPreviewUrl(val);
                          setSelectedFile(null);
                        }}
                        className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-white text-xs focus:outline-none focus:border-lime-500 transition-colors"
                        placeholder="...or paste image/video URL directly"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
                    Target URL (Optional)
                  </label>
                  <Input
                    type="text"
                    value={formData.targetUrl}
                    onChange={(e) =>
                      setFormData({ ...formData, targetUrl: e.target.value })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-lime-500 transition-colors text-sm"
                    placeholder="https://..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
                      Order
                    </label>
                    <Input
                      type="number"
                      value={formData.order}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          order: parseInt(e.target.value),
                        })
                      }
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-lime-500 transition-colors text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
                      Status
                    </label>
                    <Button
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          isActive: !formData.isActive,
                        })
                      }
                      className={`w-full h-[42px] flex items-center justify-center rounded-lg border font-bold text-[10px] uppercase tracking-widest transition-all ${formData.isActive ? "bg-lime-500/10 border-lime-500 text-lime-500" : "bg-red-500/10 border-red-500 text-red-500"}`}
                    >
                      {formData.isActive ? "Active" : "Inactive"}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-white/10 flex gap-4">
                <Button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 rounded-[8px] border border-white/10 text-white font-bold hover:bg-white/5 transition-all"
                >
                  CANCEL
                </Button>
                <Button
                  type="submit"
                  className="flex-1 py-3 rounded-[8px] bg-lime-500 text-black font-bold hover:bg-lime-400 transition-all shadow-[0_0_20px_rgba(132,204,22,0.3)]"
                >
                  SAVE BANNER
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketingManagement;
