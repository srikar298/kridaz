import React, { useState, useEffect } from "react";
import { Plus, Trash2, Tag, Upload, Link2 } from "lucide-react";
import axiosInstance from "@hooks/useAxiosInstance";
import { toast } from "react-hot-toast";
import { Button, Input } from "@kridaz/ui";

const BannerAdsManager = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetUrl, setTargetUrl] = useState("");
  const [imageFile, setImageFile] = useState(null);

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/api/admin/marketing/banners");
      if (res.data.success) {
        setBanners(res.data.banners);
      }
    } catch (error) {
      toast.error("Failed to load banner ads.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this banner?")) return;
    try {
      await axiosInstance.delete(`/api/admin/marketing/banners/${id}`);
      toast.success("Banner deleted successfully");
      fetchBanners();
    } catch (error) {
      toast.error("Failed to delete banner");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !imageFile) {
      toast.error("Title and Image are required.");
      return;
    }
    
    const formData = new FormData();
    formData.append("title", title);
    if (description) formData.append("description", description);
    if (targetUrl) formData.append("targetUrl", targetUrl);
    formData.append("image", imageFile);
    formData.append("isActive", true);
    formData.append("type", "HOME");
    formData.append("order", banners.length);

    try {
      setIsSubmitting(true);
      const res = await axiosInstance.post("/api/admin/marketing/banners", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.data.success) {
        toast.success("Banner Ad created!");
        setIsModalOpen(false);
        resetForm();
        fetchBanners();
      }
    } catch (error) {
      toast.error("Failed to create banner.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setTargetUrl("");
    setImageFile(null);
  };

  return (
    <div className="min-h-screen bg-background text-white p-6 lg:p-10 relative overflow-hidden font-inter">
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 blur-[120px] pointer-events-none" />
      
      <div className="space-y-12 relative z-10">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 border-b border-border pb-8">
          <div className="relative pl-6">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-10 bg-primary rounded-full shadow-[0_0_15px_rgba(204,255,0,0.5)]"></div>
            <h1 className="text-4xl font-black uppercase tracking-tight flex items-center gap-4">
              <Tag className="w-8 h-8 text-primary" />
              Banner Ads
            </h1>
            <p className="text-white/50 text-sm mt-2 font-medium">
              Manage promotional banners shown on the user app.
            </p>
          </div>
          
          <Button
            onClick={() => setIsModalOpen(true)}
            className="bg-primary hover:bg-primary/90 text-black font-black px-6 py-3 rounded-xl flex items-center gap-2 shadow-[0_0_20px_rgba(204,255,0,0.2)]"
          >
            <Plus size={18} />
            Add New Banner
          </Button>
        </div>

        {/* Banners Grid */}
        {loading ? (
          <div className="text-center py-20 text-white/50 animate-pulse font-medium">Loading Banners...</div>
        ) : banners.length === 0 ? (
          <div className="text-center py-20 text-white/30 border border-white/5 rounded-2xl bg-white/5 font-medium">
            No banner ads found. Create one to get started!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {banners.map((banner) => (
              <div key={banner.id} className="bg-card border border-border rounded-2xl overflow-hidden group hover:border-primary/50 transition-colors">
                <div className="h-40 w-full bg-background relative border-b border-border">
                  {banner.imageUrl ? (
                    <img src={banner.imageUrl} alt={banner.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/20">No Image</div>
                  )}
                  {banner.isActive && (
                    <div className="absolute top-3 right-3 bg-success/20 text-success border border-success/50 px-2 py-0.5 rounded text-[10px] font-black uppercase">
                      Active
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-bold text-white mb-1">{banner.title}</h3>
                  <p className="text-white/50 text-xs mb-4 line-clamp-2 min-h-[32px]">{banner.description || "No description"}</p>
                  
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                    <a href={banner.targetUrl || "#"} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-primary font-medium hover:underline">
                      <Link2 size={14} />
                      Link
                    </a>
                    <button
                      onClick={() => handleDelete(banner.id)}
                      className="text-error/70 hover:text-error bg-error/10 hover:bg-error/20 p-2 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="p-6 border-b border-border">
              <h2 className="text-xl font-bold">Add Banner Ad</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-white/70 uppercase tracking-wider mb-2 block">Banner Title</label>
                <Input 
                  placeholder="e.g. Summer Sale 20%" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)}
                  className="bg-background border-border text-white w-full"
                  required
                />
              </div>
              
              <div>
                <label className="text-xs font-bold text-white/70 uppercase tracking-wider mb-2 block">Description (Optional)</label>
                <Input 
                  placeholder="Short subtitle" 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)}
                  className="bg-background border-border text-white w-full"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-white/70 uppercase tracking-wider mb-2 block">Target Redirect URL</label>
                <Input 
                  placeholder="https://..." 
                  value={targetUrl} 
                  onChange={(e) => setTargetUrl(e.target.value)}
                  className="bg-background border-border text-white w-full"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-white/70 uppercase tracking-wider mb-2 block">Banner Image</label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files[0])}
                  className="block w-full text-sm text-white/70 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-border mt-6">
                <Button 
                  type="button" 
                  onClick={() => {
                    setIsModalOpen(false);
                    resetForm();
                  }}
                  className="bg-transparent border border-white/10 hover:bg-white/5 text-white"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="bg-primary hover:bg-primary/90 text-black font-black"
                >
                  {isSubmitting ? "Uploading..." : "Create Banner"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BannerAdsManager;
